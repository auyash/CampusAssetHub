# 🎨 Frontend Web Application (Member 3)
**Project:** NFSU Department Inventory & Student Asset Portal  
**Role:** Member 3 (Frontend & User Experience Lead)

---

## 📂 Contents
This folder contains the standalone client-side user interface:
- **`index.html`**: Complete single-page application built with HTML5, Tailwind CSS, and FontAwesome.

## 🚀 How to Run the Frontend
You have two ways to run and view this frontend:

### Option A: Directly with the Backend Server
When the backend server (`py_backend/server.py`) is running, it automatically serves this frontend at:
👉 **`http://localhost:4000/`**

### Option B: As an Independent Client (Using Any Static Server)
If Member 3 is developing the frontend separately:
```bash
# Using Python's built-in static HTTP server:
cd frontend
python -m http.server 3000
```
Then open `http://localhost:3000/` in your browser. It will communicate with the backend running on `http://localhost:4000`.

---

## 🖥️ Included Modules
1. **Coordinator Command Center:**
   - Real-time stock counters (Total, Available, Issued, Overdue, Damaged).
   - Live equipment inventory table.
   - 10-Unit Development Board visual chip grid (`DB-001` through `DB-010`).
2. **Issue Equipment Desk:**
   - Enforces automatic 15-calendar-day due date calculation on the fly.
3. **Returns & Physical Inspection Desk:**
   - Full and partial returns modal.
   - Condition inspection (`Usable`, `Damaged`, `Maintenance`).
4. **Renewal Approvals Queue:**
   - Review pending student requests and approve with 1 click (+15 Days).
5. **Student Self-Service Portal:**
   - Active borrowed equipment view.
   - Due date countdown badges.
   - One-click renewal request modal.
6. **Security & Defense Showcase (For Judges):**
   - Live attack simulation buttons for SQL Injection, IDOR, and Privilege Escalation.
7. **Forensic Audit Ledger:**
   - Displays real-time SHA-256 hash chains.
