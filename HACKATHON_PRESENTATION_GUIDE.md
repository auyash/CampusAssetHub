# 🏆 CampusAssetHub: Comprehensive Team Presentation & Evaluation Guide
**Project:** CampusAssetHub — Department Inventory & Student Asset Management System  
**Audience:** Team Members & Project Presenters  
**Target Platform:** NFSU Academic Labs / Problem Statement #5  
**Local Deployment URL:** `http://localhost:4000/`

---

## 📖 Table of Contents
1. [Executive Summary (30-Second Opening Pitch)](#1-executive-summary-30-second-opening-pitch)
2. [Core Domain Principles & Business Rules](#2-core-domain-principles--business-rules)
3. [Team Role Distribution & Talking Points](#3-team-role-distribution--talking-points)
4. [Live Demonstration Script (Click-by-Click Sequence)](#4-live-demonstration-script-click-by-click-sequence)
5. [Secure Coding & Cybersecurity Defense Showcase](#5-secure-coding--cybersecurity-defense-showcase)
6. [Evaluation Q&A Defense Strategy](#6-evaluation-qa-defense-strategy)
7. [System Recovery & Operational Procedures](#7-system-recovery--operational-procedures)

---

## 1. Executive Summary (30-Second Opening Pitch)
When presenting to the evaluation panel, begin with this clear, high-level overview:

> *"Good afternoon, members of the evaluation committee. We are presenting **CampusAssetHub**, a centralized, secure, policy-driven inventory and asset management system designed for academic department coordinators and students.*
>
> *Our solution automates the **mandatory 15-calendar-day return policy**, implements **coordinator-authorized renewal workflows**, supports **granular partial returns and condition inspections**, and enforces **forensic-grade cybersecurity protections including OWASP Top 10 mitigation and SHA-256 chained audit logging**.*
>
> *We have prepared a live demonstration to showcase both our functional workflows and our automated security controls."*

---

## 2. Core Domain Principles & Business Rules
The platform enforces four core operational rules specified in Problem Statement #5:

1. **Dual Asset Tracking Models**:
   - **Individually Tracked Equipment:** Serialized hardware (e.g., Development Boards `DB-001` through `DB-010`). Each unit possesses a unique identifier and is restricted to a single active borrower.
   - **Quantity-Based Consumables/Accessories:** Bulk reusable items (e.g., 20 USB Cables) managed through dynamic aggregate stock counters.
2. **Deterministic 15-Day Loan Calculation**:
   - Every equipment issue transaction programmatically computes:
     $$\text{Due Date} = \text{Issue Date} + 15\text{ Calendar Days}$$
   - Eliminates manual input errors and standardizes return cycles.
3. **Controlled Renewal Authorization Gate**:
   - Students may submit renewal justifications through their portal.
   - A pending request **does not** modify the active return date.
   - Formal approval by the inventory coordinator is required to extend the due date by **15 calendar days from the previous deadline**.
4. **Condition Inspection & Quarantine Control**:
   - Items returned in `USABLE` condition are immediately restored to available inventory.
   - Units returned in `DAMAGED` or `MAINTENANCE` condition are quarantined and withheld from available stock until formally serviced.
   - Partial returns are tracked by decrementing outstanding borrower balances while keeping unreturned units active.

---

## 3. Team Role Distribution & Talking Points
When asked how responsibilities were divided among the team, present the following structured breakdown:

### 👤 Member 1: Database Architect & Data Integrity Lead
- **Key Talking Points:**
  > *"I engineered our relational database layer using SQLite. I modeled separate schemas for registered students, catalog items, serialized assets, loan transactions, renewal queues, and audit trails.*
  > *To ensure structural integrity, I implemented database-level `CHECK` constraints to mathematically prevent negative stock balances, and enforced foreign key cascades to ensure no orphan loans or phantom records can exist."*

### 👤 Member 2: Backend Logic & Secure Coding Lead
- **Key Talking Points:**
  > *"I built the application service layer, policy calculation engines, and security controls. My engine manages the 15-day issue algorithm, state transitions for full and partial returns, and the two-stage renewal approval pipeline.*
  > *On the security front, I enforced 100% parameterized SQL queries to eliminate SQL injection risks, implemented server-side Insecure Direct Object Reference (IDOR) ownership guards, and developed our tamper-evident SHA-256 chained audit ledger."*

### 👤 Member 3: Frontend Interface & Demonstration Lead
- **Key Talking Points:**
  > *"I developed our responsive single-page client interface using modern Tailwind CSS. I implemented an instantaneous role switcher allowing evaluators to experience both the Coordinator command dashboard and the Student self-service portal.*
  > *I also built our interactive **Security Showcase panel**, enabling real-time execution and observation of attack simulations against our defensive perimeter."*

---

## 4. Live Demonstration Script (Click-by-Click Sequence)
*(Execute this sequential workflow on screen at `http://localhost:4000/`)*

### Step 1: Baseline Stock Overview (Tab: "Live Inventory")
1. Navigate to the **Live Inventory** tab.
2. Point out:
   - **Total Registered Stock:** 30 units (10 Development Boards + 20 USB Cables).
   - Show the visual status grid displaying individual assets `DB-001` through `DB-010`.

### Step 2: Equipment Issuance (Tab: "Issue Equipment (15-Day)")
1. Navigate to the **Issue Equipment** tab.
2. Select:
   - **Student:** `Aarav Sharma (NFSU2026DFIS001)`
   - **Item:** `ARM Cortex Development Board`
   - **Asset ID:** `DB-002` (or any available board)
   - **Purpose:** `Embedded Security Practical`
3. Click **Issue Equipment & Record Transaction**.
4. **Highlight to the panel:**
   - The confirmation prompt confirms the due date was calculated automatically as **exactly 15 calendar days** from today.
   - Available Development Boards automatically decrement from 10 to 9.

### Step 3: Student Self-Service & Renewal Mediation
1. In the top-right header, click **Student Portal**.
2. Note that the portal displays Student Aarav Sharma's active loans with dynamic countdown indicators.
3. Click **Request 15-Day Renewal**, enter a sample justification (`Extending practical lab verification`), and submit.
4. **Key Policy Demonstration:**
   - Direct the panel's attention to the due date: it has **not** extended. The status reflects `PENDING` coordinator review.
5. In the top header, switch back to **Coordinator (Admin)**.
6. Open the **Renewal Approvals** tab.
7. Click **Approve (+15 Days)**.
8. Confirm that the system has successfully extended the due date by 15 calendar days from the previous deadline.

### Step 4: Partial Return & Inspection (Tab: "Returns & Inspection")
1. Open the **Returns & Inspection** tab.
2. Select an active loan and click **Return Item**.
3. Demonstrate:
   - Entering a partial quantity (e.g., returning 1 of 2 cables).
   - Selecting the inspected physical condition (`USABLE`, `DAMAGED`, or `MAINTENANCE`).
   - Confirming that damaged units are quarantined while usable units return to stock.

---

## 5. Secure Coding & Cybersecurity Defense Showcase
Navigate to the green **Security Showcase** tab to demonstrate compliance with secure coding standards:

### Attack Vector 1: SQL Injection Mitigation (OWASP A03)
- Click **Simulate SQL Injection**.
- **Payload Tested:** `' OR '1'='1`
- **Technical Explanation:**
  > *"Our backend utilizes strictly prepared parameterized statements with positional placeholders. The query engine isolates parameters from SQL syntax, safely treating the injection payload as a literal search string and returning 0 matching records without data leakage."*

### Attack Vector 2: Broken Access Control & IDOR Defense (OWASP A01)
- Click **Simulate IDOR Attack**.
- **Scenario Tested:** Student #2 attempting to modify a borrowing record owned by Student #1.
- **Technical Explanation:**
  > *"The application enforces context-aware authorization. The server validates session credentials against resource ownership. Unauthorized manipulation immediately terminates with an HTTP 403 Forbidden status and logs the incident to the security ledger."*

### Attack Vector 3: Mass Assignment & Privilege Escalation (OWASP A04)
- Click **Simulate Mass Assignment**.
- **Scenario Tested:** A client injecting unauthorized administrative keys (`"status": "APPROVED"`) into a student renewal submission.
- **Technical Explanation:**
  > *"The server enforces strict payload whitelisting. Administrative attributes are discarded or rejected prior to business logic execution, preventing client-side privilege escalation."*

### Attack Vector 4: Forensic Tamper-Evident Audit Ledger
- Navigate to the **Audit Ledger** tab.
- Highlight the **SHA-256 Chained Hash** column and the integrity verification status.
- **Technical Explanation:**
  > *"Every critical transaction is cryptographically linked to the previous entry using SHA-256 hash chaining. Any retroactive modification or deletion within the database immediately invalidates the cryptographic chain, providing forensic-grade auditability."*

---

## 6. Evaluation Q&A Defense Strategy

### Question 1: "Why did you choose SQLite and Python standard libraries over a multi-container stack?"
> **Defense:**
> *"We prioritized zero-dependency reliability and minimized attack surface. In mission-critical lab management environments, eliminating third-party dependencies mitigates software supply chain vulnerabilities, guarantees offline operational continuity, and maintains a highly auditable codebase."*

### Question 2: "How does the system ensure stock counts remain accurate during partial returns?"
> **Defense:**
> *"The transaction engine manages issued, returned, and outstanding balances atomically. When a partial return is processed, only the returned quantity is restored to available stock, while the loan status transitions to `PARTIALLY_RETURNED` with the remaining balance kept active."*

### Question 3: "Can a user manipulate request timestamps to artificially extend their borrowing period?"
> **Defense:**
> *"No. All operational timestamps and due date calculations are derived strictly from trusted server-side system clocks. Client-provided timestamps are ignored across all business logic workflows."*

---

## 7. System Recovery & Operational Procedures

### Restarting the Application Server
If the host workstation restarts or the terminal session terminates:
1. Open a terminal or command prompt in the project directory:
   ```bash
   cd py_backend
   ```
2. Execute the application server:
   ```bash
   python server.py
   ```
3. Access the dashboard via browser:
   ```
   http://localhost:4000/
   ```

### Accessing via Secondary Devices
To present across separate laptops on the same local network:
1. Ensure both devices are connected to the same Wi-Fi network or mobile hotspot.
2. Retrieve the host IP using `ipconfig` (Windows) or `ifconfig` (macOS/Linux).
3. Access the interface from the secondary device:
   ```
   http://<HOST_IP_ADDRESS>:4000/
   ```
