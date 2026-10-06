# FinTrack — Full Implementation Plan (Review 2 → Final Submission)

This is a build brief, not a tutorial. Paste it into Antigravity as context, then hand it
tasks one at a time (see "How to drive this in Antigravity" near the bottom). Each task
has a done-when so you and the agent both know when to stop.

**Scope of this document:** the full build, both halves.
- **Part A (Tasks 1–20)** = the Review 2 milestone, 50% — schema, auth, ingestion,
  categorization, budgets, minimal frontend.
- **Part B (Tasks 21–30)** = everything needed to reach 100% for final submission —
  subscriptions, prediction/anomaly detection, NL query, PDF export, admin dashboard,
  notifications, and final testing/polish.

Don't start Part B until Part A is demoed and stable — it's the foundation the rest
of the proposal's AI/analytics features sit on.

---

## 1. Tech stack (pin these — don't let the agent improvise substitutes)

| Layer | Choice |
|---|---|
| Backend | Node.js 20, Express 4 |
| Database | MySQL 8 |
| DB access | `mysql2` driver, raw parameterized SQL (no ORM — schema, procedures, and triggers are graded, so keep them visible as real `.sql` files) |
| Auth | `jsonwebtoken`, `bcrypt` |
| File parsing | `csv-parse` |
| Frontend | React 18 + Vite, Tailwind CSS, Chart.js |
| PDF export | `pdfkit` or `puppeteer` (server-side render) |
| Testing | Jest + Supertest (backend) |

---

## 2. Repo structure

```
fintrack/
  backend/
    src/
      config/db.js
      db/
        schema.sql
        procedures.sql
        triggers.sql
        seed.sql
      routes/
        auth.routes.js
        accounts.routes.js
        categories.routes.js
        transactions.routes.js
        budgets.routes.js
        goals.routes.js
        upload.routes.js
        subscriptions.routes.js
        analytics.routes.js
        reports.routes.js
        admin.routes.js
        notifications.routes.js
      controllers/
      middleware/
        auth.middleware.js
        adminOnly.middleware.js
        errorHandler.js
      services/
        parsing.service.js
        categorization.service.js
        merchant.service.js
        subscription.service.js
        prediction.service.js
        anomaly.service.js
        nlquery.service.js
        pdf.service.js
      utils/
      app.js
      server.js
    tests/
    .env.example
    package.json
  frontend/
    src/
      pages/
        Login.jsx, Upload.jsx, Transactions.jsx, Dashboard.jsx,
        Budgets.jsx, Goals.jsx, Admin.jsx, Reports.jsx
      components/
      api/client.js
      App.jsx
    package.json
  data/
    sample_statement.csv
  docs/
    ER-diagram.png
    api-spec.md
```

---

## 3. Database schema — the 15 tables

`Users, UserSettings, Accounts, Transactions, Categories, CategoryRules, Merchants,
Budgets, Goals, Subscriptions, MonthlySummary, Notifications, UploadedFiles, AuditLog,
Currencies`

Non-negotiable constraints:
- `Categories.parent_category_id` self-references `Categories.category_id` (nullable, ON DELETE SET NULL)
- `Transactions.account_id → Accounts`, `.merchant_id → Merchants`, `.category_id → Categories`
- `Accounts.user_id → Users`; same FK pattern for `Budgets`, `Goals`, `Subscriptions`
- `CHECK` constraint on `Transactions.amount` sign convention (pick one, document it)
- `UNIQUE` constraint on `Merchants.canonical_name`
- Composite index: `(account_id, transaction_date)` on `Transactions`; index on `category_id`
- `MonthlySummary` is populated only by `sp_generate_monthly_summary` — never written to directly

Also: `sp_generate_monthly_summary(user_id, month)`, `trg_after_transaction_insert`
(updates `MonthlySummary`, checks budget threshold, inserts into `Notifications` if over
budget), `fn_categorize_transaction(description)`.

**Done-when:** `schema.sql` runs clean, all FKs enforced, procedure/trigger/function
exist in `information_schema`.

---

## 4. Algorithms — Part A modules (Review 2)

**Categorization** — normalize description → match `CategoryRules` by priority →
fallback to `fn_categorize_transaction()` → else "Uncategorized" flagged for review.

**Upload & parsing** — validate file/columns → parse via `csv-parse` → per-row validation
(collect errors, don't abort the batch) → single DB transaction wraps merchant
resolution + categorization + insert → commit or roll back to zero partial rows.

**Merchant resolution** — normalize + strip noise tokens (POS/UPI IDs, trailing numbers)
→ exact match on `canonical_name` → else fuzzy match (Levenshtein ≤ 2) → else insert new.

**Budget progress** — `spent = SUM(amount)` per user/category/month (debit rows),
`progress_pct = spent / limit * 100`, read from `MonthlySummary`, not recomputed
client-side on every load.

---

## 5. Algorithms — Part B modules (final submission)

**Subscription detection** — group transactions by `merchant_id`, look for ≥3
occurrences with amount within ±5% and interval within ±3 days of a recurring cadence
(weekly/monthly) → insert/update a `Subscriptions` row with `next_due_date` predicted
as `last_date + interval`.

**Spend prediction** — per user/category, moving average over the last 3 months of
`MonthlySummary` → forecast next month = average (or weighted average favoring the most
recent month). Keep it to this — no need for a trained model.

**Anomaly detection** — per category, compute mean and standard deviation of transaction
amounts over the last N months → flag a new transaction if `|amount - mean| > 2×stddev`
(z-score) or outside the IQR fence → surface as a flag on the transaction, not a blocking
action.

**NL-to-SQL (constrained)** — do **not** build a general NL-to-SQL system. Define a fixed
set of question templates (e.g. "how much did I spend on `<category>` in `<month>`?",
"what's my biggest expense this month?") → regex/keyword-match the user's question to a
template → fill in parameters → run the matching parameterized query → return the
number/row, not raw SQL. This keeps it explainable in the viva.

**PDF report export** — server-side render (pdfkit/puppeteer) of a monthly summary:
category breakdown table + total, pulling from `MonthlySummary` and `Transactions`.

**Admin dashboard** — read-only views over `Users`, `UploadedFiles` (status/row counts),
`AuditLog`; no write access beyond user activation/deactivation.

**Notifications** — already partially populated by `trg_after_transaction_insert`
(budget threshold); extend with a scheduled check (cron or on-login check) for upcoming
`Subscriptions.next_due_date` within 3 days.

---

## 6. Full task list (30 tasks) — hand these to Antigravity one at a time

### Part A — Review 2 milestone (50%)

| # | Task | Owner |
|---|---|---|
| 1 | Scaffold repo structure (section 2) | M1 |
| 2 | `schema.sql` — all 15 tables | M1 |
| 3 | `procedures.sql`, `triggers.sql` | M1 |
| 4 | `seed.sql` — Users, Categories, CategoryRules, Merchants | M1 |
| 5 | Generate `sample_statement.csv` (~500 synthetic rows) | M2 |
| 6 | Express skeleton, DB pool, `.env.example` | M1 |
| 7 | Auth module (register/login/JWT/bcrypt) + tests | M2 |
| 8 | Accounts + Categories CRUD routes | M1 |
| 9 | Parsing service + upload route (transactional) | M2 |
| 10 | Categorization service, wired into upload | M2 |
| 11 | Merchant resolution service, wired into upload | M2 |
| 12 | Budgets CRUD + progress query | M1 |
| 13 | Transactions list/search route (filters) | M1 |
| 14 | Integration test: full upload → categorize → summary pipeline | M2 |
| 15 | Frontend scaffold (Vite + Tailwind), routing, API client | M3 |
| 16 | Frontend: Login page | M3 |
| 17 | Frontend: Upload page | M3 |
| 18 | Frontend: Transactions page | M3 |
| 19 | Frontend: Dashboard page (1 Chart.js chart) | M3 |
| 20 | Capture Review-2 artifacts (screenshots, index EXPLAIN, trigger demo) | Whoever's free |

### Part B — remaining 50% (final submission)

| # | Task | Owner |
|---|---|---|
| 21 | Subscription detection service + scheduled/triggered check | M2 |
| 22 | Spend prediction endpoint (moving average) | M3 |
| 23 | Anomaly detection endpoint (z-score/IQR), flag on transactions | M3 |
| 24 | NL-to-SQL template engine + endpoint | M3 |
| 25 | PDF report export service + route | M3 |
| 26 | Admin dashboard backend routes + frontend page | M2 |
| 27 | Notifications: extend trigger + frontend notification view | M2 |
| 28 | Goals CRUD + frontend Goals page | M1 (backend) / M3 (frontend) |
| 29 | Full integration test suite + query performance check (index benefit demo) | M1 |
| 30 | Documentation, demo script, backup/recovery drill, final polish | All three |

**Done-when (whole plan):** every module in the Review 1 proposal's module list has a
working API + frontend page, the full test suite passes, and a backup/recovery drill has
been run and documented once.

---

## 7. Team assignment — by role (mirrors the original proposal)

**Member 1 — Data & Backend Lead**
Owns: schema, ER diagram, normalization, all SQL objects (procedures, functions,
triggers, indexes), Accounts/Categories/Budgets/Transactions-search APIs, backup/recovery
demo, final query-performance testing.
→ Tasks: 1, 2, 3, 4, 6, 8, 12, 13, 29 (+ Goals backend in 28)

**Member 2 — Application & Auth Lead**
Owns: authentication, upload/parsing pipeline, categorization + merchant resolution,
subscription detection, admin dashboard backend, notifications, security hardening.
→ Tasks: 5, 7, 9, 10, 11, 14, 21, 26, 27

**Member 3 — Frontend & Analytics Lead**
Owns: all frontend pages, charts/UI, the AI-insight features (prediction, anomaly
flagging, NL query), PDF export, documentation support.
→ Tasks: 15, 16, 17, 18, 19, 22, 23, 24, 25 (+ Goals frontend in 28)

Even with this split, **all three members should be able to explain Member 1's SQL** in
the viva — it's the most heavily graded part and reviewers will ask anyone, not just the
person who wrote it.

### Suggested weekly mapping (extends the proposal's 4-week plan to cover both reviews)

| Week | Focus | Primarily |
|---|---|---|
| 1 | ER diagram, schema, seed data | M1, all review together |
| 2 | Schema objects, backend core, auth, upload/parsing | M1 + M2 |
| 3 | Categorization, merchant resolution, budgets, frontend core → **Review 2 checkpoint** | M2 + M3 |
| 4 | Subscriptions, prediction, anomaly detection, NL query | M2 + M3 |
| 5 | PDF export, admin dashboard, notifications, Goals | M2 + M3, M1 supports |
| 6 | Integration testing, backup/recovery drill, documentation, demo rehearsal → **Final submission** | All three |

---

## 8. How to drive this in Antigravity

- Paste this whole file into the agent's context once at the start of a session (or
  point it at the file path if Antigravity can read from disk).
- Give it **one numbered task at a time**, tagged with who owns it if you're running
  separate sessions per member, e.g.:

  > Implement Task 7 from IMPLEMENTATION_PLAN.md (Auth module, owner: Member 2). Follow
  > the repo structure in section 2 and the schema in `backend/src/db/schema.sql`
  > exactly. Write it with tests. Don't touch anything outside
  > `backend/src/routes/auth.routes.js`, `backend/src/middleware/auth.middleware.js`,
  > and their tests unless necessary.

- If members are working in parallel on separate branches, merge in task-number order
  within each part — later tasks in Part A depend on earlier ones (e.g. task 9 needs the
  schema from task 2 and the auth middleware from task 7 if routes are protected).
- Review the diff before moving to the next task.
- If the agent proposes an ORM, a different DB, or skipping the stored procedure/trigger
  to save time — say no. Those are graded rubric items, not implementation details it
  can optimize away.
- Pause after task 14 (Part A integration test passing) and after task 29 (full suite
  passing) — both are natural checkpoints to run the app yourselves before moving on.

---

## 9. What this maps to on the review slides

- Review 2's "Execution — Implementation (50%)" slide = Part A, tasks 1–20.
- A final-review "Execution" slide (when you build that deck) = Part A + Part B, all 30
  tasks, grouped the same way as section 6 here.
- Keep the deck and this file in sync — if scope changes in one, update the other.
