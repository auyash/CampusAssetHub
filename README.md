# CampusAssetHub: Department Inventory & Student Asset Management System

[![Security Standard: OWASP Top 10](https://img.shields.io/badge/Security-OWASP%20Hardened-emerald)](https://owasp.org)
[![Integrity: SHA-256 Chained Ledger](https://img.shields.io/badge/Audit-SHA--256%20Chained-blue)](https://en.wikipedia.org/wiki/Cryptographic_hash_function)
[![Problem Statement: PS#5](https://img.shields.io/badge/Challenge-PS%235%20Inventory%20System-indigo)]()
[![Target: NFSU Academic Labs](https://img.shields.io/badge/Institution-NFSU-orange)]()

An enterprise-grade, secure, and policy-driven web platform developed for academic department inventory coordinators and students. The platform automates equipment issuance under strict return constraints, facilitates coordinator-mediated renewal workflows, supports partial/condition-inspected returns, and enforces forensic-level cybersecurity defenses.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Problem Statement Alignment](#problem-statement-alignment)
3. [Architecture & System Design](#architecture--system-design)
4. [Team Division & Domain Responsibilities](#team-division--domain-responsibilities)
5. [Core Functional Modules](#core-functional-modules)
6. [Secure Coding & Cybersecurity Implementations](#secure-coding--cybersecurity-implementations)
7. [Installation & Quick Start](#installation--quick-start)
8. [Multi-Device Local Network Setup](#multi-device-local-network-setup)
9. [Demonstration & Evaluation Workflow](#demonstration--evaluation-workflow)
10. [Repository Structure](#repository-structure)

---

## 1. Project Overview
Academic departments frequently handle two categories of hardware resources:
1. **High-Value Serialized Equipment:** Development boards, microcontrollers, and laboratory instruments that must be strictly monitored per student.
2. **Bulk Consumables & Reusable Accessories:** Cabling, adapters, and passive components tracked by aggregate stock balances.

Manual record-keeping often results in inventory shrinkage, unverified condition changes upon return, unauthorized loan extensions, and zero auditability. **CampusAssetHub** provides a centralized, cryptographically secured portal ensuring full accountability from issuance to return.

---

## 2. Problem Statement Alignment
The platform strictly satisfies the requirements of **Problem Statement #5: Department Inventory and Student Item Issue Management System**:

- **Strict 15-Day Return Policy:** Every issue transaction automatically computes `Due Date = Issue Date + 15 Calendar Days`.
- **Coordinator Approval for Renewals:** Submitting a renewal request sets the status to `PENDING` without extending the deadline. Only authorized coordinator approval grants an additional 15 days from the previous due date.
- **Partial Returns Support:** If a student borrows multiple quantity items (e.g., 2 USB cables) and returns only 1, the system restores available stock by 1 while keeping the remainder outstanding.
- **Physical Condition Inspection:** Items marked `DAMAGED` or `MAINTENANCE` upon return are quarantined from available stock until formally serviced.
- **Automated Overdue Detection:** Any active loan where `Current Date > Due Date` is flagged with visual indicators and days-overdue metrics.
- **Pre-Seeded Test Case:** Built-in seed data matching the official test scenario for **M.Sc. Digital Forensics and Information Security (DFIS)**, Semester I, with 10 Development Boards (`DB-001` through `DB-010`) and 20 Reusable USB Cables.

---

## 3. Architecture & System Design
The system follows a clean 3-tier architecture with zero external dependency bloat, ensuring maximum portability and auditability.

```
       +-------------------------------------------------------------+
       |               CLIENT TIER (Tailwind CSS / HTML5)             |
       |  - Coordinator Command Center    - Student Self-Service     |
       |  - Live Attack Showcase          - Tamper-Evident Ledger    |
       +------------------------------+------------------------------+
                                      | HTTP REST APIs (Port 4000)
       +------------------------------v------------------------------+
       |             APPLICATION & SECURITY TIER (Python)            |
       |  - 15-Day Policy Engine          - IDOR Authorization Guard |
       |  - Renewal Mediation Engine      - Mass-Assignment Filter   |
       |  - Condition & Stock Controller  - SHA-256 Audit Hasher     |
       +------------------------------+------------------------------+
                                      | Prepared SQL (ACID)
       +------------------------------v------------------------------+
       |                    DATA TIER (SQLite 3)                     |
       |  - Foreign Key Constraints       - Non-Negative CHECK Rules |
       |  - Serialized Assets Ledger      - Cryptographic Chain Log  |
       +-------------------------------------------------------------+
```

---

## 4. Team Division & Domain Responsibilities
The project was engineered with a strict 3-tier division of labor across team members:

| Member Domain | Key Responsibilities | Primary Artifacts |
| :--- | :--- | :--- |
| **Member 1: Database Architect** | Relational schema modeling, foreign key cascades, non-negative `CHECK` constraints, test case seeding. | `database/schema.sql`<br>`database/seed.sql`<br>`team_tasks/MEMBER_1_DATABASE_SPEC.md` |
| **Member 2: Backend & Security Engine** | RESTful route handlers, 15-day issue algorithm, renewal logic, OWASP security protections, SHA-256 audit chaining. | `py_backend/server.py`<br>`team_tasks/MEMBER_2_BACKEND_SECURITY_SPEC.md` |
| **Member 3: Frontend & UX Lead** | Responsive UI, dual role-switching, overdue badge countdowns, interactive security demonstration panel. | `frontend/index.html`<br>`frontend/README.md`<br>`team_tasks/MEMBER_3_FRONTEND_UI_SPEC.md` |

---

## 5. Core Functional Modules

### 5.1. Coordinator Command Center
- **Stock Summary Cards:** Real-time counters displaying Total Inventory (225 physical units), Available for Issue, Currently Borrowed, Overdue Units, and Quarantined/Damaged assets.
- **Dynamic Equipment & Restock Modal:** Integrated modal to onboard new hardware equipment with location tagging, categorization, and automatic serialized asset ID generation.
- **Issue Desk (Dual Student Identification):** Supports selecting from existing registered students OR entering new student details on the fly (Enrolment Number, Name, Programme, Semester, and Mobile Number). Automatically calculates the mandatory 15-day return deadline.
- **Returns & Inspection:** Allows processing complete or partial returns, selecting inspected condition (`USABLE`, `DAMAGED`, `MAINTENANCE`), and recording receiving staff remarks.
- **Renewal Approvals Queue:** Dedicated dashboard for reviewing student renewal submissions with 1-click `Approve (+15 Days)` and `Reject` actions.

### 5.2. Student Self-Service Portal & Profile Switcher
- **Dynamic Student Profile Switcher & Multi-Programme Support:** Dropdown allowing switching between registered students across diverse academic programmes (e.g. *B.Tech. CSE, B.Tech. Cyber Security, M.Sc. DFIS, M.Tech. CS*). Selecting or adding a student instantly updates the top navigation subtitle, profile badge, semester tags, and programme metadata across the entire portal.
- **Role-Based UI Isolation:** In Student Portal mode, coordinator-only navigation tabs (Live Inventory, Issue Desk, Returns, Renewal Approvals, Audit Ledger) and stock summary metrics are hidden to present a clean, isolated student interface.
- **Active Loans View:** Color-coded card listing all borrowed items with exact return dates and active countdown badges.
- **Renewal Request Flow:** Modal allowing students to submit renewal justifications, correctly maintaining `PENDING` status until authorized.

---

## 6. Secure Coding & Cybersecurity Implementations
Developed with adherence to **OWASP Top 10** secure coding principles and forensic-grade integrity standards:

### 6.1. Defense Against SQL Injection (OWASP A03)
- **Vulnerability:** Unsanitized user inputs concatenated into database queries.
- **Defense:** 100% of queries use prepared parameterized statements with positional placeholders (`?`). Input parameters are strictly isolated from query semantics.
- **Live Interactive Verification:** The platform includes an interactive testing playground where judges can enter arbitrary custom SQL payloads (e.g. `' OR '1'='1`, `'; DROP TABLE inventory_items; --`, or `' UNION SELECT ...`). The backend executes the query live through parameterized statements, returning zero leaked records and proving complete SQLi immunity.

### 6.2. Insecure Direct Object Reference (IDOR) Defense (OWASP A01)
- **Vulnerability:** A student modifying URL identifiers or headers to renew or alter another student's loan.
- **Defense:** Strict server-side ownership validation ensures that `session_student_id === loan.student_id`. Unauthorized access triggers an immediate `HTTP 403 Forbidden` response and an incident log.
- **Live Interactive Verification:** Testers can configure target loan IDs and forged student session IDs to observe immediate rejection and audit logging in real time.

### 6.3. Mass-Assignment & Privilege Escalation Defense (OWASP A04)
- **Vulnerability:** A student client injecting administrative parameters (e.g., `{"status": "APPROVED", "extended_due_date": "2027-01-01"}`) into a renewal request payload.
- **Defense:** Server-side schema whitelisting rejects or strips unauthorized fields before processing business logic.

### 6.4. Cryptographic Tamper-Evident Audit Ledger & Tamper Injection Test (OWASP A08)
- Every state change (`ISSUE`, `RETURN`, `RENEWAL_REQUEST`, `RENEWAL_APPROVE`, `SECURITY_INCIDENT`) is cryptographically appended using **SHA-256 hash chaining**:
  $$\text{Current Hash} = \text{SHA256}(\text{Timestamp} \parallel \text{Actor} \parallel \text{Action} \parallel \text{Payload} \parallel \text{Previous Hash})$$
- **Live Tamper Demonstration:** Evaluators can click **"Corrupt Database Row (Direct Tamper)"** to modify raw audit rows directly in SQLite on disk. Running **"Verify Cryptographic Integrity"** immediately flags the mismatch down to the exact row ID (`TAMPER DETECTED: Row #X Corrupted`). Clicking **"Re-sign & Restore Ledger"** re-chains and repairs the ledger.

---

## 7. Installation & Quick Start

### Prerequisites
- Python 3.10 or higher.
- Modern web browser (Chrome, Edge, Firefox, Safari).
- Zero external package installations required (uses Python standard libraries).

### Running the Application
1. Open a terminal in the project root:
   ```bash
   cd py_backend
   ```
2. Launch the application server:
   ```bash
   python server.py
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:4000/
   ```

---

## 8. Multi-Device Local Network Setup
To demonstrate the platform across multiple laptops or mobile devices simultaneously (e.g., Coordinator on one laptop, Student on another):

1. Connect all demonstration devices to the same local Wi-Fi or mobile hotspot.
2. Identify the host machine's IPv4 address:
   ```bash
   ipconfig   # On Windows
   ifconfig   # On macOS/Linux
   ```
3. Open the browser on secondary devices and navigate to:
   ```
   http://<HOST_IP_ADDRESS>:4000/
   ```
   *(Example: `http://172.19.4.85:4000/` or `http://192.168.137.1:4000/`)*

---

## 9. Demonstration & Evaluation Workflow

When presenting the solution during evaluation:

### Step 1: Initial Stock & Multi-Category Inventory
- Navigate to the **Live Inventory** tab.
- Demonstrate the comprehensive department catalog: 15 lab categories, 50 serialized assets, and 225 total units (Development Boards, Laptops, Multimeters, Oscilloscopes, Raspberry Pi 4, HackRF One SDR, Logic Analyzers, Cables, and Adapters).
- Review individual asset status chips (`USABLE`, `ISSUED`, `DAMAGED`).

### Step 2: 15-Day Issue Lifecycle & Direct Student Registration
- Switch to the **Issue Equipment** tab.
- Demonstrate selecting an existing student or entering new student details directly (Enrolment Number, Name, Programme, Semester, Contact).
- Select an item (e.g., ARM Development Board `DB-002`) and submit.
- Observe that the due date is calculated automatically as **exactly 15 calendar days** from the transaction timestamp, and available stock decrements immediately.

### Step 3: Student Portal & Renewal Mediation
- Switch to the **Student Portal** using the top-right role switcher.
- Demonstrate the **Student Profile Switcher** dropdown to inspect individual student loan accounts.
- Notice that coordinator-only navigation tabs and administrative metrics are hidden in student view (Role-Based UI Isolation).
- Locate the active loan and trigger **Request 15-Day Renewal** with a test justification.
- Note that the loan due date remains unchanged while the request status changes to `PENDING`.
- Switch back to **Coordinator**, open **Renewal Approvals**, and click **Approve (+15 Days)**.
- Confirm that the due date is extended by exactly 15 days from the previous deadline.

### Step 4: Partial Returns & Condition Quarantine
- Open the **Returns & Inspection** tab.
- Select an active loan, specify a partial quantity, and mark the condition as `DAMAGED`.
- Confirm that remaining units stay tracked on the student's account, and the damaged unit is quarantined from available stock.

### Step 5: Interactive Security Playground & Database Tamper Detection
- Open the **Security Showcase** tab:
  - **Live SQL Injection:** Type any custom payload (or choose presets like `' OR '1'='1` or `DROP TABLE`) and click **Execute Live SQL Attack**. Observe zero records leaked due to parameterized SQLite statements.
  - **Live IDOR Exploit:** Specify target loan ID and forged student ID and click **Execute Live IDOR Attack**. Observe `HTTP 403 Forbidden` response and immediate ownership enforcement.
  - **Mass Assignment:** Execute attack with injected `"status": "APPROVED"` and observe immediate whitelist rejection.
  - **Direct Database Tampering:** Click **"Corrupt Database Row"** to alter SQLite on disk, then click **"Verify Cryptographic Integrity"** to see SHA-256 hash mismatch detection down to the row number. Click **"Re-sign & Restore Ledger"** to restore cryptographic validity.
- Open the **Audit Ledger** tab: inspect the SHA-256 hash chain and confirm forensic integrity verification.

---

## 10. Repository Structure
```
CampusAssetHub/
├── README.md                      # Comprehensive project documentation
├── database/                      # Member 1: Database Architecture
│   ├── schema.sql                 # Relational schema with integrity rules
│   └── seed.sql                   # M.Sc. DFIS baseline dataset
├── frontend/                      # Member 3: Client Application
│   ├── index.html                 # Single-page interface & Attack Showcase
│   └── README.md                  # Frontend development notes
├── py_backend/                    # Member 2: Application & Security Engine
│   ├── server.py                  # Policy engine & REST API server
│   ├── inventory.db               # SQLite database instance
│   └── static/                    # Served client assets
├── team_tasks/                    # Task specifications for team coordination
│   ├── MEMBER_1_DATABASE_SPEC.md  # Database engineering requirements
│   ├── MEMBER_2_BACKEND_SECURITY_SPEC.md # Backend & security requirements
│   ├── MEMBER_3_FRONTEND_UI_SPEC.md      # UI & demo requirements
│   └── TEAM_INTEGRATION_MASTER_GUIDE.md  # Team integration guide
└── backend_service/               # TypeScript/Node.js architectural reference
```
