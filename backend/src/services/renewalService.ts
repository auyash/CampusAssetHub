import { db } from '../db/database.js';
import { recordAuditLog } from '../security/auditLogger.js';

export class RenewalService {
  /**
   * Student requests renewal.
   * STRICT MANDATORY RULE: Submitting a renewal request alone does NOT extend the due date!
   * Coordinator approval is required.
   */
  static requestRenewal(loanId: number, studentId: number, reason: string, ipAddress: string) {
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId) as any;
    if (!loan) {
      throw new Error(`Loan #${loanId} does not exist.`);
    }

    // IDOR Protection: Student cannot request renewal for someone else's loan
    if (loan.student_id !== studentId) {
      recordAuditLog(
        `STUDENT_${studentId}`,
        'STUDENT',
        'SECURITY_IDOR_BLOCKED',
        `Loan #${loanId}`,
        { error: 'Attempted to access another student loan record' },
        ipAddress
      );
      const err = new Error('Access Denied: You do not own this borrowing record.');
      (err as any).statusCode = 403;
      throw err;
    }

    if (loan.status === 'RETURNED') {
      throw new Error('Cannot request renewal for an item that has already been returned.');
    }

    // Check if there is already a pending renewal request
    const existingPending = db.prepare(`
      SELECT * FROM renewal_requests 
      WHERE loan_id = ? AND status = 'PENDING'
    `).get(loanId);

    if (existingPending) {
      throw new Error('A renewal request is already pending coordinator review for this item.');
    }

    const insert = db.prepare(`
      INSERT INTO renewal_requests (loan_id, reason, status)
      VALUES (?, ?, 'PENDING')
    `).run(loanId, reason);

    recordAuditLog(
      `STUDENT_${studentId}`,
      'STUDENT',
      'RENEWAL_REQUEST_SUBMITTED',
      `Loan #${loanId}`,
      { requestId: insert.lastInsertRowid, reason, currentDueDate: loan.due_date },
      ipAddress
    );

    return {
      requestId: insert.lastInsertRowid,
      loanId,
      status: 'PENDING',
      currentDueDate: loan.due_date,
      message: 'Renewal request submitted successfully. Due date remains unchanged until approved by coordinator.'
    };
  }

  /**
   * Coordinator Action: Approves or Rejects renewal.
   * MANDATORY RULE: Each approved renewal extends the due date by 15 calendar days from the existing due date.
   */
  static processRenewalAction(
    requestId: number,
    action: 'APPROVE' | 'REJECT',
    coordinatorName: string,
    remarks: string = '',
    actorId: string,
    ipAddress: string
  ) {
    const request = db.prepare(`
      SELECT r.*, l.due_date, l.id as loan_id, l.student_id 
      FROM renewal_requests r
      JOIN loans l ON r.loan_id = l.id
      WHERE r.id = ?
    `).get(requestId) as any;

    if (!request) {
      throw new Error(`Renewal request #${requestId} not found.`);
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Renewal request #${requestId} has already been processed with status "${request.status}".`);
    }

    const executeAction = db.transaction(() => {
      const approvalDate = new Date().toISOString();

      if (action === 'REJECT') {
        db.prepare(`
          UPDATE renewal_requests 
          SET status = 'REJECTED', approved_by = ?, approval_date = ?, remarks = ?
          WHERE id = ?
        `).run(coordinatorName, approvalDate, remarks, requestId);

        recordAuditLog(
          actorId,
          'COORDINATOR',
          'RENEWAL_REJECTED',
          `RenewalRequest #${requestId}`,
          { requestId, loanId: request.loan_id, remarks },
          ipAddress
        );

        return {
          requestId,
          status: 'REJECTED',
          message: 'Renewal request was rejected. Due date remains unchanged.'
        };
      }

      // If APPROVED: Extend due date by 15 calendar days from the existing due date!
      const currentDueObj = new Date(request.due_date);
      const extendedDueObj = new Date(currentDueObj.getTime() + 15 * 24 * 60 * 60 * 1000);
      const extendedDueStr = extendedDueObj.toISOString();

      // Update Request record
      db.prepare(`
        UPDATE renewal_requests 
        SET status = 'APPROVED', approved_by = ?, approval_date = ?, remarks = ?, extended_due_date = ?
        WHERE id = ?
      `).run(coordinatorName, approvalDate, remarks, extendedDueStr, requestId);

      // Update Loan record with new extended due date and RENEWED status
      db.prepare(`
        UPDATE loans 
        SET due_date = ?, status = 'RENEWED' 
        WHERE id = ?
      `).run(extendedDueStr, request.loan_id);

      recordAuditLog(
        actorId,
        'COORDINATOR',
        'RENEWAL_APPROVED',
        `Loan #${request.loan_id}`,
        {
          requestId,
          loanId: request.loan_id,
          previousDueDate: request.due_date,
          newDueDate: extendedDueStr,
          extendedByDays: 15
        },
        ipAddress
      );

      return {
        requestId,
        status: 'APPROVED',
        loanId: request.loan_id,
        previousDueDate: request.due_date,
        newDueDate: extendedDueStr,
        message: `Renewal approved! Due date extended by 15 calendar days to ${extendedDueStr.split('T')[0]}.`
      };
    });

    return executeAction();
  }

  /**
   * Fetches all loans with automated Overdue detection:
   * Marked as overdue if current date > due date and not returned.
   */
  static getLoans(filter?: { studentId?: number; status?: string }) {
    const nowIso = new Date().toISOString();

    // Query all active loans
    let query = `
      SELECT 
        l.*,
        s.name as student_name,
        s.enrolment_no,
        s.programme,
        i.item_name,
        i.item_code,
        CASE 
          WHEN (l.status IN ('ACTIVE', 'RENEWED', 'PARTIALLY_RETURNED') AND l.due_date < datetime('now'))
          THEN 1 ELSE 0 
        END as is_overdue,
        CASE 
          WHEN (l.status IN ('ACTIVE', 'RENEWED', 'PARTIALLY_RETURNED') AND l.due_date < datetime('now'))
          THEN CAST((julianday('now') - julianday(l.due_date)) AS INTEGER)
          ELSE 0 
        END as overdue_days
      FROM loans l
      JOIN students s ON l.student_id = s.id
      JOIN inventory_items i ON l.item_id = i.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (filter?.studentId) {
      query += ` AND l.student_id = ?`;
      params.push(filter.studentId);
    }
    if (filter?.status) {
      query += ` AND l.status = ?`;
      params.push(filter.status);
    }

    query += ` ORDER BY l.id DESC`;

    return db.prepare(query).all(...params);
  }

  /**
   * Get all pending renewal requests for Coordinator queue
   */
  static getPendingRenewals() {
    return db.prepare(`
      SELECT 
        r.*,
        l.due_date as current_due_date,
        l.issued_quantity,
        s.name as student_name,
        s.enrolment_no,
        i.item_name,
        l.asset_id
      FROM renewal_requests r
      JOIN loans l ON r.loan_id = l.id
      JOIN students s ON l.student_id = s.id
      JOIN inventory_items i ON l.item_id = i.id
      ORDER BY r.id DESC
    `).all();
  }
}
