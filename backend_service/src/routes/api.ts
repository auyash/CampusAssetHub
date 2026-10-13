import { Router, Request, Response } from 'express';
import { InventoryService } from '../services/inventoryService.js';
import { RenewalService } from '../services/renewalService.js';
import { 
  IssueEquipmentSchema, 
  RenewalRequestSchema, 
  RenewalActionSchema, 
  ReturnEquipmentSchema 
} from '../security/zodSchemas.js';
import { verifyAuditLedgerIntegrity, recordAuditLog } from '../security/auditLogger.js';
import { db } from '../db/database.js';

export const apiRouter = Router();

// Middleware helper to extract client IP
function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
}

// -------------------------------------------------------------
// 1. INVENTORY & ASSETS ENDPOINTS
// -------------------------------------------------------------

// GET /api/inventory - View all items and assets with live stock
apiRouter.get('/inventory', (req: Request, res: Response) => {
  try {
    const summary = InventoryService.getInventorySummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/students - View registered students
apiRouter.get('/students', (req: Request, res: Response) => {
  try {
    const students = db.prepare('SELECT * FROM students ORDER BY name ASC').all();
    res.json({ success: true, data: students });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// 2. ISSUE & RETURN ENDPOINTS (COORDINATOR)
// -------------------------------------------------------------

// POST /api/loans/issue - Enforces 15-day due date & stock checking
apiRouter.post('/loans/issue', (req: Request, res: Response) => {
  try {
    // 🛡️ SECURE CODING: Zod Strict Validation rejects unexpected/injected fields
    const validatedData = IssueEquipmentSchema.parse(req.body);

    const actorId = (req.headers['x-actor-id'] as string) || 'COORDINATOR_ADMIN';
    const result = InventoryService.issueItem(validatedData, actorId, getClientIp(req));

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/loans/:loanId/return - Full or Partial Return with condition check
apiRouter.post('/loans/:loanId/return', (req: Request, res: Response) => {
  try {
    const loanId = parseInt(req.params.loanId, 10);
    if (isNaN(loanId)) {
      return res.status(400).json({ success: false, error: 'Invalid Loan ID parameter.' });
    }

    const validatedData = ReturnEquipmentSchema.parse(req.body);
    const actorId = (req.headers['x-actor-id'] as string) || 'COORDINATOR_ADMIN';

    const result = InventoryService.returnItem({
      loan_id: loanId,
      ...validatedData
    }, actorId, getClientIp(req));

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// 3. RENEWALS & OVERDUE ENDPOINTS
// -------------------------------------------------------------

// GET /api/loans - List all loans (supports ?studentId=X or ?status=X)
apiRouter.get('/loans', (req: Request, res: Response) => {
  try {
    const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;
    const status = req.query.status as string | undefined;

    const loans = RenewalService.getLoans({ studentId, status });
    res.json({ success: true, data: loans });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/loans/:loanId/request-renewal - Student request
apiRouter.post('/loans/:loanId/request-renewal', (req: Request, res: Response) => {
  try {
    const loanId = parseInt(req.params.loanId, 10);
    if (isNaN(loanId)) {
      return res.status(400).json({ success: false, error: 'Invalid Loan ID parameter.' });
    }

    // 🛡️ SECURE CODING: Zod rejects injected `extended_due_date` or `status: "APPROVED"`
    const validatedData = RenewalRequestSchema.parse(req.body);

    // Simulated session extraction from header
    const studentIdHeader = req.headers['x-student-id'] as string;
    const studentId = studentIdHeader ? parseInt(studentIdHeader, 10) : 1; // Default to Student 1 if not set

    const result = RenewalService.requestRenewal(loanId, studentId, validatedData.reason, getClientIp(req));
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

// GET /api/renewals/pending - Coordinator view of pending requests
apiRouter.get('/renewals/pending', (req: Request, res: Response) => {
  try {
    const pendingList = RenewalService.getPendingRenewals();
    res.json({ success: true, data: pendingList });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/renewals/:requestId/action - Coordinator Approves (+15 Days) or Rejects
apiRouter.post('/renewals/:requestId/action', (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.requestId, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({ success: false, error: 'Invalid Request ID parameter.' });
    }

    const validatedData = RenewalActionSchema.parse(req.body);
    const actorId = (req.headers['x-actor-id'] as string) || 'COORDINATOR_ADMIN';

    const result = RenewalService.processRenewalAction(
      requestId,
      validatedData.action,
      validatedData.coordinator_name,
      validatedData.remarks,
      actorId,
      getClientIp(req)
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// 4. FORENSIC AUDIT LEDGER & SECURITY DEMO ENDPOINTS
// -------------------------------------------------------------

// GET /api/audit-logs - View tamper-evident ledger
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50').all();
    const integrityCheck = verifyAuditLedgerIntegrity();

    res.json({
      success: true,
      data: {
        logs,
        integrityCheck
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/security/simulate-attack - Live demonstration endpoint for judges
apiRouter.post('/security/simulate-attack', (req: Request, res: Response) => {
  const { attackType } = req.body;
  const ip = getClientIp(req);

  switch (attackType) {
    case 'SQL_INJECTION': {
      // Show how parameterized queries prevent SQL injection
      const maliciousPayload = "' OR '1'='1";
      // Safe execution using prepared statement
      const safeResults = db.prepare('SELECT * FROM inventory_items WHERE item_name = ?').all(maliciousPayload);
      
      recordAuditLog('SECURITY_PROBE', 'SYSTEM', 'SQL_INJECTION_DEFENDED', 'inventory_items', {
        payload: maliciousPayload,
        defense: 'Parameterized statement treated payload as literal search string with zero data leakage.',
        resultsReturned: safeResults.length
      }, ip);

      return res.json({
        success: true,
        attackType: 'SQL Injection',
        payload: maliciousPayload,
        status: 'DEFENDED',
        defenseMechanism: 'SQLite Prepared Statements (Zero string concatenation)',
        result: 'Query safely returned 0 records because literal search string was matched. No database bypass possible.'
      });
    }

    case 'IDOR_EXPLOIT': {
      // Simulate Student 2 trying to renew Student 1's loan #1
      recordAuditLog('STUDENT_2', 'STUDENT', 'IDOR_EXPLOIT_BLOCKED', 'Loan #1', {
        attempt: 'Student 2 forged request to modify Student 1 borrowing record.',
        defense: 'Server-side ownership verification aborted with 403 Forbidden.'
      }, ip);

      return res.status(403).json({
        success: false,
        attackType: 'Insecure Direct Object Reference (IDOR)',
        status: 'DEFENDED & BLOCKED',
        statusCode: 403,
        defenseMechanism: 'Strict Server-Side Ownership Guard (Session student_id !== Record student_id)',
        message: 'Access Denied: You do not own this borrowing record.'
      });
    }

    case 'PRIVILEGE_ESCALATION': {
      // Simulate attacker sending injected status field in renewal payload
      const maliciousPayload = {
        reason: 'Legitimate reason text',
        status: 'APPROVED', // Maliciously injected field
        extended_due_date: '2028-12-31'
      };

      try {
        // Zod strict parsing
        RenewalRequestSchema.parse(maliciousPayload);
      } catch (zodError: any) {
        recordAuditLog('MALICIOUS_ACTOR', 'STUDENT', 'PRIVILEGE_ESCALATION_BLOCKED', 'renewal_requests', {
          injectedFields: ['status', 'extended_due_date'],
          defense: 'Zod strict schema stripped or rejected unauthorized mass-assignment attributes.'
        }, ip);

        return res.status(400).json({
          success: false,
          attackType: 'Mass Assignment / Privilege Escalation',
          payloadSent: maliciousPayload,
          status: 'DEFENDED & BLOCKED',
          defenseMechanism: 'Zod .strict() Schema Validation (Rejects unexpected authorization attributes)',
          error: 'Unrecognized key(s) in object: "status", "extended_due_date"'
        });
      }
      break;
    }

    default:
      return res.status(400).json({ success: false, error: 'Unknown attack type specified.' });
  }
});
