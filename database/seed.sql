-- =====================================================================
-- MANDATORY SEED DATA (Problem Statement #5 Test Case Scenario)
-- M.Sc. DFIS, Semester I: 10 Development Boards & 20 Reusable USB Cables
-- =====================================================================

-- 1. Registered Students
INSERT INTO students (enrolment_no, name, programme, semester, email, contact_no) VALUES
('NFSU2026DFIS001', 'Aarav Sharma', 'M.Sc. DFIS', 1, 'aarav.dfis@nfsu.ac.in', '9876543210'),
('NFSU2026DFIS002', 'Diya Patel', 'M.Sc. DFIS', 1, 'diya.dfis@nfsu.ac.in', '9876543211'),
('NFSU2026DFIS003', 'Rohan Mehta', 'M.Sc. DFIS', 1, 'rohan.dfis@nfsu.ac.in', '9876543212');

-- 2. Department Inventory Catalog
INSERT INTO inventory_items (id, item_code, item_name, category, description, make_model, is_individually_tracked, total_quantity, available_quantity, storage_location) VALUES
(1, 'DEV-BOARD-STM32', 'ARM Cortex Development Board', 'Embedded Systems', 'Lab board for hardware security & firmware analysis', 'STM32-F407G', 1, 10, 10, 'Lab 204, Cabinet A'),
(2, 'USB-C-2M', 'Reusable USB-C Data Cable 2m', 'Accessories', 'High speed shielded cable', 'Standard OEM', 0, 20, 20, 'Lab 204, Drawer 2');

-- 3. Individual Serialized Assets (DB-001 through DB-010)
INSERT INTO individual_assets (item_id, asset_id, serial_number, condition, is_issued) VALUES
(1, 'DB-001', 'SN-DEV-001', 'USABLE', 0),
(1, 'DB-002', 'SN-DEV-002', 'USABLE', 0),
(1, 'DB-003', 'SN-DEV-003', 'USABLE', 0),
(1, 'DB-004', 'SN-DEV-004', 'USABLE', 0),
(1, 'DB-005', 'SN-DEV-005', 'USABLE', 0),
(1, 'DB-006', 'SN-DEV-006', 'USABLE', 0),
(1, 'DB-007', 'SN-DEV-007', 'USABLE', 0),
(1, 'DB-008', 'SN-DEV-008', 'USABLE', 0),
(1, 'DB-009', 'SN-DEV-009', 'USABLE', 0),
(1, 'DB-010', 'SN-DEV-010', 'USABLE', 0);
