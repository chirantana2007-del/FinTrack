# FinTrack — Handover & Status Report for M1 & M2

This report outlines the current state of the FinTrack codebase, specifically detailing what Member 3 (Frontend & Analytics Lead) has completed, and defining the exact remaining tasks for Member 1 and Member 2 as per the `IMPLEMENTATION_PLAN (1).md`. 

Please provide this document to your respective AI agents when working on your branches to avoid merge conflicts and ensure seamless integration.

---

## 🟢 1. What Member 3 Has Completed (DO NOT OVERWRITE)
All **Part B** tasks assigned to Member 3 are 100% complete, fully wired to the backend, and styled with full Dark Mode support.

- **Task 28 (Goals Frontend):** `Budgets.jsx` has been completely dynamicized. It now fetches from the `/goals` endpoint and maps real database goals to the SVG progress rings.
- **Tasks 22, 23, 24 (AI Insights):** `Insights.jsx` and `insights.controller.js` are fully complete.
  - **Predictions:** Moving average SQL logic is active and forecasting next month's spend.
  - **Anomalies:** Real statistical Z-score/IQR models are actively querying `STDDEV()` and `AVG()` from the database to flag outliers.
  - **NL-to-SQL:** The Natural Language engine is fully operational with smart regex matching and typo-tolerance (e.g., mapping "food" to multiple DB categories) and executes safely against the DB.
- **Task 25 (PDF Export):** `Report.jsx` successfully hits the backend and downloads the generated PDF/CSV reports.
- **UI/UX Foundations:** `index.css` has a robust CSS variable system for dark mode. All charts in `Dashboard.jsx` are dynamically theme-aware.

---

## 🟡 2. Member 1 (Data & Backend Lead) — Remaining Tasks
**Focus:** Database performance, integration testing, and core logic stability.

- **Task 28 (Goals Backend Validation):** The `/goals` endpoint routes and controllers exist and M3 has wired the frontend to them. Please ensure the backend CRUD operations for creating/updating goals are fully tested and bug-free.
- **Task 29 (Testing & Performance):** 
  - Write the full integration test suite (Jest + Supertest) covering the upload → categorize → summary pipeline.
  - Prepare the query performance check. You must demonstrate the benefit of the composite indexes using `EXPLAIN` queries for the viva.
- **Task 30 (Documentation):** Run and document the database Backup & Recovery drill.

---

## 🟡 3. Member 2 (Application & Auth Lead) — Remaining Tasks
**Focus:** Subscriptions, Admin UI, and Notifications.

- **Task 21 (Subscriptions):** Build the Subscription detection service. Group transactions by `merchant_id` to find recurring cadences (±5% amount, ±3 days) and populate the `Subscriptions` table with a `next_due_date`.
- **Task 26 (Admin Dashboard):** Build the Admin backend routes (read-only views over `Users`, `UploadedFiles`, `AuditLog`) and the **Frontend Admin page** (`Admin.jsx`).
- **Task 27 (Notifications):** Extend the DB triggers or create a cron job to check for upcoming subscriptions (due in ≤ 3 days) and build the frontend notification dropdown/view.

---

## 🔴 4. Strict Instructions for M1 & M2's AI Agents
When spinning up your agents to complete the above tasks in a separate branch, **PASTE THE FOLLOWING DIRECTIVES INTO THEIR PROMPT:**

> **CRITICAL DIRECTIVES FOR MERGING & PRs:**
> 1. **Do NOT touch M3's Files:** Do not modify `Insights.jsx`, `Budgets.jsx`, `Dashboard.jsx`, `Transactions.jsx`, `Report.jsx`, `index.css`, or `insights.controller.js`. M3's logic is locked and verified. Any changes to these will cause severe merge conflicts.
> 2. **Pull from Main First:** Before you start your tasks, ensure you have pulled the latest `main` branch so you have M3's finalized API contracts and CSS foundation.
> 3. **UI/UX Consistency (For M2's Admin/Notification UI):** M3 has established a strict Tailwind CSS variable system in `index.css` (e.g., `bg-surface-container-low`, `text-primary-container`). You MUST use these semantic CSS variables for the Admin Dashboard and Notifications components to ensure they automatically support Dark Mode. Do NOT use hardcoded colors (like `bg-gray-800` or `text-blue-500`).
> 4. **No ORMs:** Member 1's backend tasks must continue using raw parameterized SQL (`mysql2`). Do not introduce Prisma, Sequelize, or any other ORM, as raw SQL schemas and triggers are strictly graded rubric items.
