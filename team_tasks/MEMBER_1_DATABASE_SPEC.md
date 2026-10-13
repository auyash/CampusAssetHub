# 🗄️ TASK SPECIFICATION: DATABASE & DATA ARCHITECTURE (MEMBER 1)
**Project:** Department Inventory and Student Item Issue Management System  
**Institution/Target:** NFSU Hackathon / Secure Coding Initiative  
**Assigned Member:** Member 1 (Database Architect)  
**Deliverable:** Database schema, migrations, constraints, seed dataset, and cryptographic integrity mechanisms.

---

## 🎯 Objective
Design and implement the relational database schema supporting:
1. Two distinct item types:
   - **Individually Tracked Assets** (Laptops, Development Boards with unique Asset IDs).
   - **Quantity-Based Items** (USB cables, adapters tracked by counts).
2. Complete 15-day issue, return, and renewal transaction lifecycle.
3. Database-level constraints to prevent negative stock and data inconsistencies.
4. **Secure Coding**: Tamper-evident forensic audit log schema with SHA-256 integrity hash chaining.
5. Pre-seeded test case data specified in the official problem statement.

---

## 📋 Table Specifications & Schema Design (SQLite / PostgreSQL / MySQL)

### 1. `students` Table
Tracks registered students authorized to borrow equipment.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `enrolment_no` (TEXT UNIQUE NOT NULL) — e.g., `"NFSU2026DFIS001"`
- `name` (TEXT NOT NULL)
- `programme` (TEXT NOT NULL) — e.g., `"M.Sc. DFIS"`
- `semester` (INTEGER NOT NULL) — e.g., `1`
- `email` (TEXT UNIQUE NOT NULL)
- `contact_no` (TEXT NOT NULL)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

---

### 2. `inventory_items` Table
Catalog of all department items (both unique assets and bulk quantity items).
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `item_code` (TEXT UNIQUE NOT NULL) — e.g., `"DEV-BOARD-01"`, `"USB-C-CABLE"`
- `item_name` (TEXT NOT NULL)
- `category` (TEXT NOT NULL) — e.g., `"Electronics"`, `"Accessories"`
- `description` (TEXT)
- `make_model` (TEXT)
- `is_individually_tracked` (BOOLEAN NOT NULL DEFAULT 0) — `1` for assets with unique IDs, `0` for bulk items
- `total_quantity` (INTEGER NOT NULL CHECK(total_quantity >= 0))
- `available_quantity` (INTEGER NOT NULL CHECK(available_quantity >= 0))
- `storage_location` (TEXT NOT NULL) — e.g., `"Lab 304, Cupboard B"`
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

---

### 3. `individual_assets` Table
Tracks specific unique units for items where `is_individually_tracked = 1`.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `item_id` (INTEGER NOT NULL, FOREIGN KEY REFERENCES `inventory_items(id)`)
- `asset_id` (TEXT UNIQUE NOT NULL) — e.g., `"DB-001"`, `"DB-014"`
- `serial_number` (TEXT)
- `condition` (TEXT NOT NULL DEFAULT 'USABLE') — CHECK: `'USABLE'`, `'DAMAGED'`, `'MAINTENANCE'`, `'RETIRED'`
- `is_issued` (BOOLEAN NOT NULL DEFAULT 0) — `1` if currently with a student, `0` if in lab
- `location_notes` (TEXT)

---

### 4. `loans` (Item Issues) Table
Core record of issued items enforcing the strict 15-day return rule.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `student_id` (INTEGER NOT NULL, FOREIGN KEY REFERENCES `students(id)`)
- `item_id` (INTEGER NOT NULL, FOREIGN KEY REFERENCES `inventory_items(id)`)
- `asset_id` (TEXT, FOREIGN KEY REFERENCES `individual_assets(asset_id)`) — NULL for quantity items
- `issued_quantity` (INTEGER NOT NULL DEFAULT 1 CHECK(issued_quantity > 0))
- `returned_quantity` (INTEGER NOT NULL DEFAULT 0 CHECK(returned_quantity >= 0))
- `purpose` (TEXT)
- `issue_date` (DATETIME NOT NULL)
- `due_date` (DATETIME NOT NULL) — **Calculated as `issue_date + 15 calendar days`**
- `status` (TEXT NOT NULL DEFAULT 'ACTIVE') — CHECK: `'ACTIVE'`, `'RENEWED'`, `'RETURNED'`, `'PARTIALLY_RETURNED'`, `'OVERDUE'`
- `issuing_staff` (TEXT NOT NULL)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

---

### 5. `renewal_requests` Table
Tracks student renewal submissions and coordinator decisions.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `loan_id` (INTEGER NOT NULL, FOREIGN KEY REFERENCES `loans(id)`)
- `request_date` (DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)
- `reason` (TEXT NOT NULL)
- `status` (TEXT NOT NULL DEFAULT 'PENDING') — CHECK: `'PENDING'`, `'APPROVED'`, `'REJECTED'`
- `approved_by` (TEXT)
- `approval_date` (DATETIME)
- `remarks` (TEXT)
- `extended_due_date` (DATETIME) — Calculated as **existing `due_date + 15 calendar days`** upon approval

---

### 6. `returns` Table
Records condition inspection upon return.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `loan_id` (INTEGER NOT NULL, FOREIGN KEY REFERENCES `loans(id)`)
- `return_date` (DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)
- `quantity_returned` (INTEGER NOT NULL CHECK(quantity_returned > 0))
- `condition_on_return` (TEXT NOT NULL) — CHECK: `'USABLE'`, `'DAMAGED'`, `'MAINTENANCE'`
- `receiving_staff` (TEXT NOT NULL)
- `remarks` (TEXT)

---

### 7. `audit_logs` Table (Forensic-Grade Tamper Evident)
Secure coding requirement for auditability.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `timestamp` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `actor_id` (TEXT NOT NULL) — Username or Enrolment Number
- `actor_role` (TEXT NOT NULL) — `'COORDINATOR'`, `'STUDENT'`, `'SYSTEM'`
- `action` (TEXT NOT NULL) — `'ISSUE'`, `'RETURN'`, `'RENEWAL_REQUEST'`, `'RENEWAL_APPROVE'`, `'STOCK_ADJUSTMENT'`
- `target_entity` (TEXT NOT NULL) — e.g., `"Loan #102"` or `"Asset DB-014"`
- `details` (TEXT NOT NULL) — JSON string of payload
- `ip_address` (TEXT)
- `previous_hash` (TEXT NOT NULL) — SHA-256 hash of previous audit log row
- `current_hash` (TEXT NOT NULL) — SHA-256 hash of (`timestamp + actor_id + action + details + previous_hash`)

---

## 🌱 Mandatory Seed Data (From Problem Statement)

```sql
-- Students
INSERT INTO students (enrolment_no, name, programme, semester, email, contact_no) VALUES
('NFSU2026DFIS001', 'Aarav Sharma', 'M.Sc. DFIS', 1, 'aarav.dfis@nfsu.ac.in', '9876543210'),
('NFSU2026DFIS002', 'Diya Patel', 'M.Sc. DFIS', 1, 'diya.dfis@nfsu.ac.in', '9876543211'),
('NFSU2026DFIS003', 'Rohan Mehta', 'M.Sc. DFIS', 1, 'rohan.dfis@nfsu.ac.in', '9876543212');

-- Inventory: 10 Development Boards (Tracked individually) and 20 USB Cables (Quantity tracked)
INSERT INTO inventory_items (id, item_code, item_name, category, is_individually_tracked, total_quantity, available_quantity, storage_location) VALUES
(1, 'DEV-BOARD-STM32', 'STM32 Development Board', 'Embedded Systems', 1, 10, 10, 'Lab 201, Cabinet A'),
(2, 'USB-C-2M', 'Reusable USB-C Cable 2m', 'Accessories', 0, 20, 20, 'Lab 201, Drawer 3');

-- Individual Assets (DB-001 to DB-010)
INSERT INTO individual_assets (item_id, asset_id, serial_number, condition, is_issued) VALUES
(1, 'DB-001', 'SN-STM-001', 'USABLE', 0),
(1, 'DB-002', 'SN-STM-002', 'USABLE', 0),
(1, 'DB-003', 'SN-STM-003', 'USABLE', 0),
(1, 'DB-004', 'SN-STM-004', 'USABLE', 0),
(1, 'DB-005', 'SN-STM-005', 'USABLE', 0),
(1, 'DB-006', 'SN-STM-006', 'USABLE', 0),
(1, 'DB-007', 'SN-STM-007', 'USABLE', 0),
(1, 'DB-008', 'SN-STM-008', 'USABLE', 0),
(1, 'DB-009', 'SN-STM-009', 'USABLE', 0),
(1, 'DB-010', 'SN-STM-010', 'USABLE', 0);
```

---

## 🔒 Secure Coding Checklist for Member 1:
- [x] All foreign keys enabled (`PRAGMA foreign_keys = ON;`).
- [x] Table `CHECK` constraints prevent negative stock balances.
- [x] `audit_logs` table designed for cryptographic hash verification.
- [x] Provide a helper script `verify_audit_integrity()` that recalculates SHA-256 hashes sequentially to detect tampering.
