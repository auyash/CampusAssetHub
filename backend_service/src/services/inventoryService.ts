import { db } from '../db/database.js';
import { recordAuditLog } from '../security/auditLogger.js';

export interface IssueInput {
  student_id: number;
  item_id: number;
  asset_id?: string;
  quantity: number;
  purpose: string;
  issuing_staff: string;
  custom_issue_date?: string;
}

export interface ReturnInput {
  loan_id: number;
  quantity_returned: number;
  condition: 'USABLE' | 'DAMAGED' | 'MAINTENANCE';
  receiving_staff: string;
  remarks?: string;
}

export class InventoryService {
  /**
   * Enforces 15-day issue policy:
   * Due Date = Issue Date + 15 Calendar Days
   */
  static issueItem(input: IssueInput, actorId: string, ipAddress: string) {
    // 1. Verify Student exists
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(input.student_id) as any;
    if (!student) {
      throw new Error(`Student ID ${input.student_id} is not registered in the system.`);
    }

    // 2. Verify Item exists
    const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(input.item_id) as any;
    if (!item) {
      throw new Error(`Item ID ${input.item_id} does not exist.`);
    }

    // 3. Check Tracked Asset vs Bulk Item
    if (item.is_individually_tracked) {
      if (!input.asset_id) {
        throw new Error(`Item "${item.item_name}" is an individually tracked asset. A valid Asset ID must be specified.`);
      }
      if (input.quantity !== 1) {
        throw new Error(`Individually tracked assets can only be issued one at a time (Quantity must be 1).`);
      }

      // Check asset status
      const asset = db.prepare('SELECT * FROM individual_assets WHERE asset_id = ? AND item_id = ?').get(input.asset_id, item.id) as any;
      if (!asset) {
        throw new Error(`Asset ID "${input.asset_id}" was not found under ${item.item_name}.`);
      }
      if (asset.is_issued) {
        throw new Error(`Asset "${input.asset_id}" is currently issued to another student.`);
      }
      if (asset.condition !== 'USABLE') {
        throw new Error(`Asset "${input.asset_id}" cannot be issued because its condition is "${asset.condition}".`);
      }
    }

    // 4. Check available stock
    if (item.available_quantity < input.quantity) {
      throw new Error(`Insufficient stock: ${input.quantity} items requested, but only ${item.available_quantity} currently available.`);
    }

    // 5. Calculate 15-day due date
    const issueDateObj = input.custom_issue_date ? new Date(input.custom_issue_date) : new Date();
    const dueDateObj = new Date(issueDateObj.getTime() + 15 * 24 * 60 * 60 * 1000); // Exactly 15 calendar days

    const issueDateStr = issueDateObj.toISOString();
    const dueDateStr = dueDateObj.toISOString();

    // 6. Execute atomic database transaction
    const executeTransaction = db.transaction(() => {
      // A. Decrement available stock
      db.prepare(`
        UPDATE inventory_items 
        SET available_quantity = available_quantity - ? 
        WHERE id = ?
      `).run(input.quantity, item.id);

      // B. If individual asset, mark as issued
      if (input.asset_id) {
        db.prepare(`
          UPDATE individual_assets 
          SET is_issued = 1 
          WHERE asset_id = ?
        `).run(input.asset_id);
      }

      // C. Insert Loan record
      const loanInsert = db.prepare(`
        INSERT INTO loans (student_id, item_id, asset_id, issued_quantity, returned_quantity, purpose, issue_date, due_date, status, issuing_staff)
        VALUES (?, ?, ?, ?, 0, ?, ?, ?, 'ACTIVE', ?)
      `).run(student.id, item.id, input.asset_id || null, input.quantity, input.purpose, issueDateStr, dueDateStr, input.issuing_staff);

      const loanId = loanInsert.lastInsertRowid;

      // D. Record cryptographic audit log
      recordAuditLog(
        actorId,
        'COORDINATOR',
        'ISSUE_ITEM',
        `Loan #${loanId}`,
        {
          loanId,
          student: student.name,
          enrolment: student.enrolment_no,
          item: item.item_name,
          assetId: input.asset_id || null,
          quantity: input.quantity,
          issueDate: issueDateStr,
          dueDate: dueDateStr
        },
        ipAddress
      );

      return {
        loanId,
        studentName: student.name,
        enrolmentNo: student.enrolment_no,
        itemName: item.item_name,
        assetId: input.asset_id || null,
        issuedQuantity: input.quantity,
        issueDate: issueDateStr,
        dueDate: dueDateStr,
        message: `Successfully issued. Due date set to 15 calendar days (${dueDateStr.split('T')[0]}).`
      };
    });

    return executeTransaction();
  }

  /**
   * Handles Full and Partial Returns, plus Condition Inspection
   */
  static returnItem(input: ReturnInput, actorId: string, ipAddress: string) {
    const loan = db.prepare(`
      SELECT l.*, i.item_name, i.is_individually_tracked 
      FROM loans l
      JOIN inventory_items i ON l.item_id = i.id
      WHERE l.id = ?
    `).get(input.loan_id) as any;

    if (!loan) {
      throw new Error(`Loan record #${input.loan_id} not found.`);
    }

    if (loan.status === 'RETURNED') {
      throw new Error(`This loan record #${input.loan_id} has already been completely returned.`);
    }

    const remainingQty = loan.issued_quantity - loan.returned_quantity;
    if (input.quantity_returned > remainingQty) {
      throw new Error(`Cannot return ${input.quantity_returned} items. Only ${remainingQty} items remain outstanding.`);
    }

    const newReturnedTotal = loan.returned_quantity + input.quantity_returned;
    const isFullyReturned = newReturnedTotal === loan.issued_quantity;
    const newStatus = isFullyReturned ? 'RETURNED' : 'PARTIALLY_RETURNED';

    const executeReturn = db.transaction(() => {
      // 1. Insert return log
      db.prepare(`
        INSERT INTO returns (loan_id, quantity_returned, condition_on_return, receiving_staff, remarks)
        VALUES (?, ?, ?, ?, ?)
      `).run(loan.id, input.quantity_returned, input.condition, input.receiving_staff, input.remarks || '');

      // 2. Update loan record
      db.prepare(`
        UPDATE loans 
        SET returned_quantity = ?, status = ? 
        WHERE id = ?
      `).run(newReturnedTotal, newStatus, loan.id);

      // 3. Condition handling: Only restore stock if USABLE!
      if (input.condition === 'USABLE') {
        db.prepare(`
          UPDATE inventory_items 
          SET available_quantity = available_quantity + ? 
          WHERE id = ?
        `).run(input.quantity_returned, loan.item_id);

        if (loan.asset_id && isFullyReturned) {
          db.prepare(`
            UPDATE individual_assets 
            SET is_issued = 0, condition = 'USABLE' 
            WHERE asset_id = ?
          `).run(loan.asset_id);
        }
      } else {
        // Damaged or maintenance: keep unavailable until coordinator repairs
        if (loan.asset_id) {
          db.prepare(`
            UPDATE individual_assets 
            SET is_issued = 0, condition = ? 
            WHERE asset_id = ?
          `).run(input.condition, loan.asset_id);
        }
      }

      // 4. Audit Log
      recordAuditLog(
        actorId,
        'COORDINATOR',
        'RETURN_ITEM',
        `Loan #${loan.id}`,
        {
          loanId: loan.id,
          quantityReturned: input.quantity_returned,
          condition: input.condition,
          remainingOutstanding: loan.issued_quantity - newReturnedTotal,
          status: newStatus
        },
        ipAddress
      );

      return {
        loanId: loan.id,
        quantityReturned: input.quantity_returned,
        condition: input.condition,
        remainingOutstanding: loan.issued_quantity - newReturnedTotal,
        status: newStatus,
        stockRestored: input.condition === 'USABLE'
      };
    });

    return executeReturn();
  }

  /**
   * Fetches all items with real-time stock balances
   */
  static getInventorySummary() {
    const items = db.prepare(`
      SELECT 
        i.*,
        (SELECT COUNT(*) FROM individual_assets a WHERE a.item_id = i.id AND a.condition = 'DAMAGED') as damaged_count,
        (SELECT COUNT(*) FROM individual_assets a WHERE a.item_id = i.id AND a.condition = 'MAINTENANCE') as maintenance_count
      FROM inventory_items i
    `).all();

    const assets = db.prepare(`
      SELECT a.*, i.item_name 
      FROM individual_assets a
      JOIN inventory_items i ON a.item_id = i.id
    `).all();

    return { items, assets };
  }
}
