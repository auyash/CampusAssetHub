# 🏆 HACKATHON PRESENTATION & DEMO GUIDE
**System:** NFSU Department Asset & Student Equipment Management System  
**Problem Statement:** Problem #5 (Academic Lab Asset & 15-Day Issue Lifecycle)  
**Live Application URL:** `http://localhost:4000/`

---

## 🎯 What the System Does in Plain English (Say This First)
> *"Judges, academic departments face a huge challenge tracking valuable hardware lab kits (like development boards) and consumable bulk accessories (like USB cables). Items get lost, overdue, or returned damaged.*
> 
> *We built a unified, policy-driven web application tailored for NFSU that enforces a **strict 15-calendar-day return rule**, allows coordinator-approved **renewals (+15 days)**, supports **partial returns**, and implements **forensic-grade Secure Coding standards (OWASP Top 10 defense & SHA-256 chained audit ledgers)**."*

---

## 👥 How to Explain the 3 Roles to the Judges

When the judges ask how your team divided the work, here is the clean story:

### 1. Database Architect (Member 1 Role)
- **What to say:**
  > *"I designed our relational data architecture in SQLite. We solved the problem of handling two fundamentally different item types:*
  > *1. **Individually Tracked Assets** (like our 10 Development Boards `DB-001` through `DB-010`), each having a unique serial number and single-student exclusivity.*
  > *2. **Quantity-Based Bulk Items** (like our 20 USB cables), tracked by dynamic available counts.*
  > *I also implemented database-level `CHECK` constraints to mathematically prevent negative stock balances and orphan loans."*

### 2. Backend & Security Engine Lead (Member 2 Role - You)
- **What to say:**
  > *"I built the backend business logic and the security engine. My engine enforces the core rules:*
  > *1. **The 15-Day Rule**: Every issue transaction auto-calculates `Due Date = Issue Date + 15 calendar days`.*
  > *2. **The Renewal Gate**: Submitting a request does NOT extend the date. Only Coordinator approval extends it by an additional 15 days from the previous due date.*
  > *3. **Secure Coding**: I implemented parameterized queries for 100% SQLi immunity, server-side IDOR checks to stop students from tampering with other students' records, and cryptographic SHA-256 chaining on every audit log entry."*

### 3. Frontend & Demo Experience Lead (Member 3 Role)
- **What to say:**
  > *"I developed our responsive single-page dashboard using modern Tailwind CSS. It features:*
  > *1. **Instant Role-Switching** between Coordinator view and Student self-service view.*
  > *2. **Overdue & Countdown Badges**: Color-coded warnings (green for active, red for overdue).*
  > *3. **The Live Security Showcase**: An interactive panel where judges can click buttons to simulate real cyberattacks and witness our defenses working live in real time."*

---

## 🎬 Step-by-Step Live Demo Script (2 Minutes on Screen)

Open your browser to: **`http://localhost:4000/`**

### Step 1: Show the Initial Stock (30 Seconds)
1. Stay on the **"Live Inventory"** tab.
2. Point out:
   - **Total Items: 30** (10 Development Boards + 20 USB Cables).
   - Show the 10 green chips for **DB-001** to **DB-010**.

### Step 2: Demonstrate the 15-Day Issue Rule (30 Seconds)
1. Click **"Issue Equipment (15-Day)"** tab.
2. Select **Student: Aarav Sharma**.
3. Select **Item: ARM Cortex Development Board**, Asset: **DB-002**.
4. Click **"Issue Equipment & Record Transaction"**.
5. **Point out to judges:** Notice the notification banner! The due date was automatically set to **exactly 15 calendar days** from today, and available boards decreased from 10 to 9.

### Step 3: Switch to Student Portal & Request Renewal (30 Seconds)
1. In the top right header, click **"Student Portal"**.
2. Show Aarav Sharma's active borrowed equipment and the due date.
3. Click **"Request 15-Day Renewal"** and enter: *"Need extra time for lab practical"*.
4. **Point out to judges:** Notice that the due date **did NOT change**! Problem Statement #5 explicitly requires Coordinator approval before any extension is granted.
5. Switch back to **"Coordinator (Admin)"** in the header.
6. Click **"Renewal Approvals"** tab $\rightarrow$ Click **"Approve (+15 Days)"**.
7. The system now extends the due date by **15 days to November 12th**!

### Step 4: Blow the Judges Away with the "Security Showcase" (30 Seconds)
1. Click the **"Security Showcase"** tab (highlighted in emerald green).
2. Tell the judges: *"We were instructed to do Secure Coding. Let me demonstrate our real-time defenses against OWASP vulnerabilities."*
3. Click **"Simulate SQL Injection"**:
   - Server runs `' OR '1'='1` with parameterized statements $\rightarrow$ safely returns 0 rows, preventing data leakage.
4. Click **"Simulate IDOR Attack"**:
   - Server rejects Student 2 trying to access Student 1's records with **HTTP 403 Forbidden**.
5. Click **"Simulate Mass Assignment"**:
   - Server catches unauthorized `"status": "APPROVED"` injected into the JSON and blocks privilege escalation.
6. Click the **"Audit Ledger"** tab:
   - Show the **SHA-256 cryptographic hashes** chaining each event sequentially, proving the logs cannot be tampered with.

---

## ❓ Probable Questions Judges Will Ask & Your Answers

**Q: "How do you handle partial returns?"**
> **A:** *"If a student borrows 2 USB cables and returns only 1, the coordinator records a return of 1 item. The system restores 1 cable to available stock, marks the loan as PARTIALLY_RETURNED, and keeps 1 cable outstanding against the student until returned."*

**Q: "What happens if a returned item is damaged?"**
> **A:** *"When processing a return, the coordinator selects the condition: Usable, Damaged, or Maintenance. If marked Damaged or Maintenance, the item is quarantined and is NOT added back to available stock until repaired."*

**Q: "Why did you use SQLite and standard Python?"**
> **A:** *"To achieve zero external dependencies, 100% offline reliability during live presentations, and native support for ACID transactions and cryptographic hashing."*
