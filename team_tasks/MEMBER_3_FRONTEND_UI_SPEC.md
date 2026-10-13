# 🎨 TASK SPECIFICATION: FRONTEND UI & DEMO EXPERIENCE (MEMBER 3)
**Project:** Department Inventory and Student Item Issue Management System  
**Institution/Target:** NFSU Hackathon / Secure Coding Initiative  
**Assigned Member:** Member 3 (Frontend & User Experience Lead)  
**Deliverable:** Responsive, modern dashboard with Role Switcher (Coordinator vs Student), Issue/Return desks, Overdue countdowns, and an interactive "Security & Attack Defense Showcase" panel.

---

## 🎯 Objective
Build a clean, high-impact web interface tailored to the requirements of Problem Statement #5.
The UI must allow judges to see:
1. **Live Stock Health & Overdue status** at a glance.
2. Complete simulation of the required test case (M.Sc. DFIS: 10 Boards, 20 USB Cables).
3. Seamless switching between **Coordinator View** and **Student View**.
4. **The Security Demo Showcase Tab:** An interactive panel where judges can click buttons to simulate attacks (SQLi, IDOR, Privilege Escalation) and observe real-time defenses.

---

## 🖥️ Screen & Component Specifications

### 1. Navigation & Role Switcher Header
- Top navbar with NFSU Department branding: **"Department Inventory & Asset Management"**.
- **Role Switcher Dropdown / Pill Toggle:**
  - 👔 `Coordinator View (Admin)`
  - 🎓 `Student View (Aarav Sharma - DFIS)`
- Notification bell displaying count of pending renewal requests and overdue items.

---

### 2. Coordinator Dashboard (Admin View)
- **Metric Cards (Top row):**
  - 📦 **Total Assets:** `30`
  - 🟢 **Available for Issue:** `28`
  - 🟡 **Currently Issued:** `2`
  - 🔴 **Overdue Items:** (Highlighted with badge)
  - 🔧 **In Repair / Damaged:** `0`
- **Tabbed Interface:**
  1. **Live Stock Catalog:**
     - Displays items categorized by type (*Individually Tracked* vs *Quantity Bulk*).
     - Visual badges showing condition (`USABLE`, `DAMAGED`, `MAINTENANCE`).
     - Search bar and category filter.
  2. **Issue Equipment Desk:**
     - Form: Select Student (Dropdown or autocomplete), Select Item, Select Asset ID (if tracked) or Quantity.
     - Auto-calculates and displays: **"Calculated Due Date: [Date + 15 Days]"** in bold blue text.
     - Button: `Issue Item & Generate Acknowledgment`.
  3. **Return Desk:**
     - Search active loans by Student Enrolment number.
     - Return interface: Quantity to return (supports partial return), Condition radio buttons (`Usable`, `Damaged`, `Needs Repair`), Staff remarks.
  4. **Renewal Approvals Queue:**
     - Table of pending student renewal requests.
     - Shows: Student Name, Item, Current Due Date, Reason for request.
     - Actions: Green `Approve (+15 Days)` and Red `Reject` buttons with remarks modal.

---

### 3. Student Portal (Self-Service View)
- **Active Loans Section:**
  - Card layout for each borrowed item.
  - Displays: Item Name, Asset ID, Issue Date, Due Date.
  - **Dynamic Countdown Pill:**
    - Green: `Due in 12 days`
    - Amber: `Due in 2 days`
    - Red pulse: `OVERDUE by 3 days`
  - **Action Button:** `Request 15-Day Renewal`.
    - Opens a clean modal with Reason text area.
    - Shows info banner: *"Submitting a request does not extend your due date until approved by the coordinator."*
- **Borrowing History Table:**
  - Shows past loans, return dates, and recorded conditions.

---

### 4. Interactive "Security Showcase" Panel (The Winning Feature!)
Judges specifically evaluate **Secure Coding**. Add a dedicated tab: **"🛡️ Security & Defense Showcase"** with 3 interactive live demonstration widgets:

#### Widget A: Simulate SQL Injection Attack
- Input with sample malicious payload: `' OR '1'='1` in the item search.
- Button: `Run Attack Simulation`.
- UI displays:
  - ❌ **Without Defense:** Leaks confidential database records.
  - ✅ **With Our Defense (Parameterized Statements):** Treats payload as a literal string $\rightarrow$ Returns 0 records found safely.

#### Widget B: Simulate IDOR Vulnerability Exploit
- Scenario: Student 1 attempts to submit a renewal or cancel a loan owned by Student 2.
- Button: `Trigger IDOR Exploit Request`.
- UI displays:
  - Red badge: `HTTP 403 Forbidden - Access Denied: Ownership mismatch`.
  - Shows the incident being logged to the tamper-evident audit ledger.

#### Widget C: Simulate Privilege Escalation (Mass Assignment)
- Scenario: Student sends raw JSON adding `"status": "APPROVED"` to self-approve a loan extension.
- Button: `Send Malicious Payload`.
- UI displays:
  - Green badge: `Defended! Server Zod schema stripped unauthorized status field. Request remained PENDING.`

---

### 5. Forensic Audit Ledger View
- A live table showing every system event with:
  - Timestamp, Actor, Role, Event, Target, and **SHA-256 Hash**.
  - A green badge: **"Ledger Integrity: 100% Verified (Zero Tampering Detected)"**.

---

## 🎨 Recommended UI Libraries
- **Framework:** React / Next.js with **Tailwind CSS**
- **Icons:** `lucide-react` (icons like `Package`, `ShieldCheck`, `AlertTriangle`, `Calendar`, `User`)
- **Components:** Clean cards, modals, and badge pills.
