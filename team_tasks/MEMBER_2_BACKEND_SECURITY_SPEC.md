# ⚙️ TASK SPECIFICATION: BACKEND & SECURE CODING ENGINE (MEMBER 2)
**Project:** Department Inventory and Student Item Issue Management System  
**Institution/Target:** NFSU Hackathon / Secure Coding Initiative  
**Assigned Member:** Member 2 (Backend & Security Lead)  
**Deliverable:** REST API endpoints, business logic enforcement (15-day rule, partial returns, renewals), and security defenses (IDOR, SQLi immunity, mass assignment protection).

---

## 🎯 Objective
Build the backend server and business logic service layer with strict enforcement of:
1. **The 15-Day Automatic Calculation Rule:** `due_date = issue_date + 15 calendar days`.
2. **Renewal Logic:** Submitting a request does **not** change the due date. Coordinator approval extends it by exactly **15 days from the previous due date**.
3. **Stock Control:** Prevent overdrafts, handle partial returns, track individual assets vs bulk quantities.
4. **SECURE CODING STANDARDS (OWASP Top 10):**
   - 100% Parameterized queries (no string concatenation).
   - Strict DTO / Schema validation using **Zod** (blocks Mass Assignment & Privilege Escalation).
   - Server-side IDOR (Insecure Direct Object Reference) authorization checks.
   - SHA-256 tamper-evident audit log creation on every state-changing endpoint.

---

## 📡 API Endpoints to Implement

### 1. Issue Equipment
- **Route:** `POST /api/loans/issue`
- **Authorized Role:** `COORDINATOR`
- **Payload Schema:**
  ```json
  {
    "student_id": 1,
    "item_id": 1,
    "asset_id": "DB-001", // optional (required only if item is individually tracked)
    "quantity": 1,
    "purpose": "Hardware Security Lab assignment",
    "issuing_staff": "Dr. Sharma"
  }
  ```
- **Business Logic:**
  - Verify student exists and is registered.
  - If `is_individually_tracked == 1`:
    - Ensure `asset_id` exists, is in `USABLE` condition, and `is_issued == 0`.
    - Mark asset as `is_issued = 1`.
  - Check available stock: `available_quantity >= quantity`. If not, return error: `"Requested X items, only Y available."`
  - Decrement `available_quantity` by `quantity`.
  - Calculate `due_date = current_timestamp + 15 days`.
  - Insert into `loans`.
  - Append entry to `audit_logs` with SHA-256 chaining.

---

### 2. Request Renewal (Student Action)
- **Route:** `POST /api/loans/:loanId/request-renewal`
- **Authorized Role:** `STUDENT`
- **Payload Schema:**
  ```json
  {
    "reason": "Need extra time to complete cryptographic verification tests"
  }
  ```
- **Security Check (IDOR Prevention):**
  - Verify that the authenticated session student ID strictly matches `loan.student_id`.
  - If mismatch, reject immediately with `403 Forbidden` and log potential IDOR attack.
- **Business Logic:**
  - Verify loan status is `ACTIVE` and current date <= `due_date`.
  - Check that there is no existing `PENDING` request for this loan.
  - Insert row in `renewal_requests` with status `PENDING`.
  - **IMPORTANT:** Do NOT alter `due_date` on the loan!

---

### 3. Approve / Reject Renewal (Coordinator Action)
- **Route:** `POST /api/renewals/:requestId/action`
- **Authorized Role:** `COORDINATOR`
- **Payload Schema:**
  ```json
  {
    "action": "APPROVE", // or "REJECT"
    "remarks": "Approved as per lab faculty recommendation",
    "coordinator_name": "Lab Admin"
  }
  ```
- **Business Logic:**
  - If `REJECT`: update request status to `REJECTED`, record remarks.
  - If `APPROVE`:
    - Update request status to `APPROVED`.
    - **Extend loan due date:** `new_due_date = old_due_date + 15 calendar days`.
    - Update loan status to `RENEWED`.
  - Write audit log entry.

---

### 4. Return Equipment (Full or Partial Return)
- **Route:** `POST /api/loans/:loanId/return`
- **Authorized Role:** `COORDINATOR`
- **Payload Schema:**
  ```json
  {
    "quantity_returned": 1,
    "condition": "USABLE", // or "DAMAGED", "MAINTENANCE"
    "receiving_staff": "Lab Admin",
    "remarks": "Returned in proper working order"
  }
  ```
- **Business Logic:**
  - Check: `quantity_returned <= (loan.issued_quantity - loan.returned_quantity)`.
  - Increment `loan.returned_quantity`.
  - If `returned_quantity == issued_quantity`: mark loan `RETURNED`. Else: mark `PARTIALLY_RETURNED`.
  - If condition == `USABLE`:
    - Increment `inventory_items.available_quantity`.
    - If asset: set `is_issued = 0`.
  - If condition == `DAMAGED` or `MAINTENANCE`:
    - Do NOT increment available quantity.
    - Set asset condition to `DAMAGED` / `MAINTENANCE`.
  - Write audit log entry.

---

### 5. Overdue Items Calculation
- **Route:** `GET /api/loans/overdue`
- **Authorized Role:** `COORDINATOR`, `STUDENT` (filtered)
- **Query Logic:**
  - Select all loans where `status IN ('ACTIVE', 'RENEWED', 'PARTIALLY_RETURNED')` AND `due_date < CURRENT_TIMESTAMP`.
  - Calculate `overdue_days = FLOOR((now - due_date) / 86400)`.

---

## 🛡️ Secure Coding Implementations (For Evaluation & Scoring)

### A. Mass Assignment Defense (Zod Schema Middleware)
```typescript
// Strict schema: Even if attacker injects "status: APPROVED", Zod discards it!
export const RenewalRequestSchema = z.object({
  reason: z.string().min(5).max(300).trim(),
}).strict(); // .strict() rejects unknown fields
```

### B. IDOR Authorization Guard
```typescript
export function assertLoanOwnership(reqUser: User, loan: Loan) {
  if (reqUser.role === 'COORDINATOR') return true;
  if (reqUser.studentId !== loan.student_id) {
    recordSecurityIncident('IDOR_ATTEMPT', reqUser, `Tried to access loan ${loan.id}`);
    throw new ForbiddenError('Access Denied: You do not own this borrowing record');
  }
}
```

### C. Tamper-Evident SHA-256 Audit Chaining
```typescript
import crypto from 'crypto';

export function createAuditLog(actor: string, role: string, action: string, details: object, prevHash: string) {
  const timestamp = new Date().toISOString();
  const payload = JSON.stringify(details);
  const dataToHash = `${timestamp}|${actor}|${role}|${action}|${payload}|${prevHash}`;
  const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
  
  // Insert into DB (timestamp, actor, role, action, payload, prevHash, currentHash)
}
```
