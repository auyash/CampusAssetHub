# 🚀 BACKEND QUICK-START & TESTING GUIDE (MEMBER 2)
**Project:** NFSU Secure Department Inventory & Student Item Issue Management System  
**Role:** Member 2 (Backend & Security Engine)

---

## 📦 What We Have Built
All files for the complete backend service are in `scratch/backend_service/`:
1. **`src/db/database.ts`**: SQLite schema with foreign key constraints, `CHECK` constraints, and automatic seed data (M.Sc. DFIS, 10 Development Boards `DB-001` to `DB-010`, 20 USB Cables).
2. **`src/services/inventoryService.ts`**: 
   - Issues equipment with automatic **15-calendar-day due date calculation** (`due_date = issue_date + 15 days`).
   - Prevents stock overdrafts (`available_quantity >= requested`).
   - Handles **Partial Returns** and condition inspections (`USABLE`, `DAMAGED`, `MAINTENANCE`).
3. **`src/services/renewalService.ts`**: 
   - Student submits renewal request (due date remains unchanged).
   - Coordinator approval extends due date by **15 calendar days from existing due date**.
   - Overdue calculation (`current_date > due_date`).
4. **`src/security/zodSchemas.ts`**: Strict Zod DTO validation blocking **Mass Assignment & Privilege Escalation**.
5. **`src/security/auditLogger.ts`**: Forensic-grade **SHA-256 Tamper-Evident Chained Audit Ledger** with integrity verification.
6. **`src/routes/api.ts`**: REST API endpoints + live **Security Demonstration endpoint** (`/api/security/simulate-attack`).
7. **`src/server.ts`**: Express server secured with `helmet`, CORS, and payload limits.

---

## 🏃 How to Run the Backend
From the `backend_service` folder:
```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Start the development server with live reload
npm run dev
```
The server will boot on `http://localhost:4000`.

---

## 🧪 Live Verification & cURL Test Commands

### 1. Check Inventory & Seed Data
```bash
curl -X GET http://localhost:4000/api/inventory
```

### 2. Issue a Development Board (DB-001) + 2 USB Cables (Test Case Scenario)
```bash
# Issue Board DB-001 to Student 1 (Aarav Sharma)
curl -X POST http://localhost:4000/api/loans/issue \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "item_id": 1,
    "asset_id": "DB-001",
    "quantity": 1,
    "purpose": "Hardware Security Lab",
    "issuing_staff": "Dr. Sharma"
  }'

# Issue 2 USB Cables to Student 1
curl -X POST http://localhost:4000/api/loans/issue \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "item_id": 2,
    "quantity": 2,
    "purpose": "Interfacing Board",
    "issuing_staff": "Dr. Sharma"
  }'
```

### 3. Student Requests Renewal
```bash
curl -X POST http://localhost:4000/api/loans/1/request-renewal \
  -H "Content-Type: application/json" \
  -H "x-student-id: 1" \
  -d '{
    "reason": "Need extra time for cryptographic verification"
  }'
```

### 4. Coordinator Approves Renewal (+15 Days)
```bash
curl -X POST http://localhost:4000/api/renewals/1/action \
  -H "Content-Type: application/json" \
  -d '{
    "action": "APPROVE",
    "coordinator_name": "Lab Admin",
    "remarks": "Approved extension"
  }'
```

### 5. Partial Return (Return 1 of 2 cables in USABLE condition)
```bash
curl -X POST http://localhost:4000/api/loans/2/return \
  -H "Content-Type: application/json" \
  -d '{
    "quantity_returned": 1,
    "condition": "USABLE",
    "receiving_staff": "Lab Admin"
  }'
```

### 6. Verify Tamper-Evident SHA-256 Audit Ledger
```bash
curl -X GET http://localhost:4000/api/audit-logs
```

### 7. Trigger Live Attack Simulation (For Judges)
```bash
# Simulate SQL Injection defense
curl -X POST http://localhost:4000/api/security/simulate-attack \
  -H "Content-Type: application/json" \
  -d '{"attackType": "SQL_INJECTION"}'

# Simulate IDOR defense
curl -X POST http://localhost:4000/api/security/simulate-attack \
  -H "Content-Type: application/json" \
  -d '{"attackType": "IDOR_EXPLOIT"}'

# Simulate Privilege Escalation defense
curl -X POST http://localhost:4000/api/security/simulate-attack \
  -H "Content-Type: application/json" \
  -d '{"attackType": "PRIVILEGE_ESCALATION"}'
```
