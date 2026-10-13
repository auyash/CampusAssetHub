-- =====================================================================
-- NFSU DEPARTMENT INVENTORY & ASSET MANAGEMENT DATABASE SCHEMA
-- Role: Member 1 (Database Architect)
-- Compliant with Problem Statement #5 & Forensic Secure Coding Standards
-- =====================================================================

PRAGMA foreign_keys = ON;

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enrolment_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    programme TEXT NOT NULL,
    semester INTEGER NOT NULL,
    email TEXT UNIQUE NOT NULL,
    contact_no TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inventory Items Table (Bulk Quantity + Tracked Asset parent records)
CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_code TEXT UNIQUE NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    make_model TEXT,
    is_individually_tracked BOOLEAN NOT NULL DEFAULT 0,
    total_quantity INTEGER NOT NULL CHECK(total_quantity >= 0),
    available_quantity INTEGER NOT NULL CHECK(available_quantity >= 0),
    storage_location TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Individual Assets Table (Unique serialized assets, e.g. DB-001 to DB-010)
CREATE TABLE IF NOT EXISTS individual_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    asset_id TEXT UNIQUE NOT NULL,
    serial_number TEXT,
    condition TEXT NOT NULL DEFAULT 'USABLE' CHECK(condition IN ('USABLE', 'DAMAGED', 'MAINTENANCE', 'RETIRED')),
    is_issued BOOLEAN NOT NULL DEFAULT 0,
    location_notes TEXT
);

-- 4. Loans Table (Enforces 15-day policy: due_date = issue_date + 15 days)
CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id),
    item_id INTEGER NOT NULL REFERENCES inventory_items(id),
    asset_id TEXT REFERENCES individual_assets(asset_id),
    issued_quantity INTEGER NOT NULL DEFAULT 1 CHECK(issued_quantity > 0),
    returned_quantity INTEGER NOT NULL DEFAULT 0 CHECK(returned_quantity >= 0),
    purpose TEXT,
    issue_date DATETIME NOT NULL,
    due_date DATETIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'RENEWED', 'RETURNED', 'PARTIALLY_RETURNED', 'OVERDUE')),
    issuing_staff TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Renewal Requests Table (Coordinator approval adds +15 days)
CREATE TABLE IF NOT EXISTS renewal_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approved_by TEXT,
    approval_date DATETIME,
    remarks TEXT,
    extended_due_date DATETIME
);

-- 6. Returns Table (Condition checks and partial return records)
CREATE TABLE IF NOT EXISTS returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    return_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quantity_returned INTEGER NOT NULL CHECK(quantity_returned > 0),
    condition_on_return TEXT NOT NULL CHECK(condition_on_return IN ('USABLE', 'DAMAGED', 'MAINTENANCE')),
    receiving_staff TEXT NOT NULL,
    remarks TEXT
);

-- 7. Forensic-Grade Tamper-Evident Audit Logs (Cryptographic SHA-256 Chaining)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT,
    previous_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL
);
