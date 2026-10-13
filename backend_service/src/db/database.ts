import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'inventory.db');
export const db = new Database(dbPath);

// Enable foreign key constraints (Mandatory for relational data integrity)
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
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

    -- 2. Inventory Items (both bulk quantity and individually tracked parent items)
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

    -- 3. Individual Assets (Unique serialized units, e.g. DB-001 to DB-010)
    CREATE TABLE IF NOT EXISTS individual_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
      asset_id TEXT UNIQUE NOT NULL,
      serial_number TEXT,
      condition TEXT NOT NULL DEFAULT 'USABLE' CHECK(condition IN ('USABLE', 'DAMAGED', 'MAINTENANCE', 'RETIRED')),
      is_issued BOOLEAN NOT NULL DEFAULT 0,
      location_notes TEXT
    );

    -- 4. Loans Table (Enforces 15-day policy)
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

    -- 5. Renewal Requests (Student asks, Coordinator approves)
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

    -- 7. Forensic-Grade Audit Logs (Tamper Evident SHA-256 Chained Ledger)
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
  `);

  // Seed sample data if empty
  seedDatabaseIfEmpty();
}

function seedDatabaseIfEmpty() {
  const rowCount = db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number };
  if (rowCount.count > 0) return;

  console.log('[DB] Seeding official NFSU test case scenario (M.Sc. DFIS)...');

  const insertStudent = db.prepare(`
    INSERT INTO students (enrolment_no, name, programme, semester, email, contact_no)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertStudent.run('NFSU2026DFIS001', 'Aarav Sharma', 'M.Sc. DFIS', 1, 'aarav.dfis@nfsu.ac.in', '9876543210');
  insertStudent.run('NFSU2026DFIS002', 'Diya Patel', 'M.Sc. DFIS', 1, 'diya.dfis@nfsu.ac.in', '9876543211');
  insertStudent.run('NFSU2026DFIS003', 'Rohan Mehta', 'M.Sc. DFIS', 1, 'rohan.dfis@nfsu.ac.in', '9876543212');

  // Insert 10 Development boards & 20 USB Cables as required by Problem Statement #5
  const insertItem = db.prepare(`
    INSERT INTO inventory_items (id, item_code, item_name, category, description, make_model, is_individually_tracked, total_quantity, available_quantity, storage_location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertItem.run(1, 'DEV-BOARD-STM32', 'ARM Cortex Development Board', 'Embedded Systems', 'Lab board for embedded systems security', 'STM32-F407G', 1, 10, 10, 'Lab 204, Cabinet A');
  insertItem.run(2, 'USB-C-2M', 'Reusable USB-C Data Cable 2m', 'Accessories', 'High speed shielded cable', 'Standard OEM', 0, 20, 20, 'Lab 204, Drawer 2');

  // Insert the 10 specific assets (DB-001 through DB-010)
  const insertAsset = db.prepare(`
    INSERT INTO individual_assets (item_id, asset_id, serial_number, condition, is_issued)
    VALUES (?, ?, ?, 'USABLE', 0)
  `);

  for (let i = 1; i <= 10; i++) {
    const pad = i.toString().padStart(3, '0');
    insertAsset.run(1, `DB-${pad}`, `SN-DEV-${pad}`);
  }

  console.log('[DB] Seeding complete! 3 Students, 10 Development Boards, 20 USB Cables ready.');
}
