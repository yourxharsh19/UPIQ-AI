# UPIQ AI 2.0 — Frontend Application

This directory contains the single-page application (SPA) client for UPIQ AI 2.0, built with React 19, Vite 8, Tailwind CSS 4, and Lucide React.

---

## 1. Quick Start

```powershell
cd frontend
npm install
npm run dev
```

* **Development Server:** `http://localhost:5173`
* **Production Build:** `npm run build`
* **Linter & Type/Syntax Check:** `npm run check` (runs `oxlint` and `vite build`)
* **Unit Test Suite:** `npm test` (runs Node.js native test runner on `test/*.test.js`)

---

## 2. Features Implemented Across Tasks (0–8)

### Task 1: CSV & PDF Statement Upload UI
* **Direct File Intake:** Accepts both `.csv` and `.pdf` bank statement files up to 10MB using the existing `/api/pdf/upload` and `/api/pdf/import` backend routes.
* **Client-Side Validation:** Validates file size (max 10MB), non-empty payload (> 0 bytes), and extensions (`.csv`, `.pdf`, `.txt`) before hitting the network.
* **Interactive Workflow:** Drag-and-drop zone, parsing progress spinner, candidate row preview table, and a detailed completion summary (rows imported, duplicates skipped, invalid rows omitted).

### Task 2: Dashboard & Ledger Consistency
* **Real-time Backend Synchronization:** Transaction create, edit, delete, and bulk delete operations immediately refetch the live transaction list (`/api/transactions`) and deterministic dashboard summary (`/api/financial/dashboard`).
* **Zero Stale State:** Eliminated optimistic duplication, desynced charts, and leftover numbers when transactions are deleted.

### Task 3: User-Scoped Budget Persistence & JSON Transfer
* **Per-User Isolation:** Stored in browser storage partitioned by user ID (`upiq_budgets_user_${userId}`), with seamless one-time migration from legacy unpartitioned storage.
* **Cross-Device Portability:** Built-in **Export Budgets (JSON)** and **Import Budgets (JSON)** features.
* **Honest Disclosure:** Labeled in UI with the persistent note: *"Budgets are saved on this device only"*.

### Task 4: Session & Auth Handling
* **Instant Expiry Detection:** JWT expiry and structure are validated before view mounting; expired or tampered tokens are discarded immediately without UI flashing.
* **Interceptor & Notification:** Protected 401 API responses purge local credentials and dispatch a session expiration toast while redirecting to Login.
* **Protected Views:** Unauthenticated direct route requests redirect to `/login` with friendly guidance and remember the intended return tab.

### Task 5: Report History & Preview Snapshots
* **User-Scoped Snapshot Persistence:** Generated and downloaded monthly report summaries are stored in `upiq_report_history_user_${userId}`.
* **Interactive Archive:** Users can review, re-preview, and delete past snapshots, labeled *"Saved on this device only"*.

### Task 6: Honest Labels for Limitations
* **Linear Run-Rates:** Category spending estimates are labeled `"Estimate (not AI prediction)"`.
* **Bounded Assistant:** Clear disclaimers specify supported financial ledger intents and explain that AI natural language responses require the backend + Ollama.
* **Unavailable Features Labeled "Coming soon":** Disabled non-functional elements (Google login, OCR scanned image PDFs, GNN transaction fraud detection, push notifications, and live admin telemetry) rather than fabricating fake simulators.

### Task 7: Theme System (Light + Dark + System)
* **Subtle Academic Palette:** Academic navy (`#1e40af` light / `#3b82f6` dark), slate text (`#0f172a` / `#f8fafc`), and pure white (`#ffffff`) canvas in light mode.
* **3-Way Theme Switcher:** Instant switching between Light ☀️, Dark 🌙, and System 💻 modes in Header and Profile.
* **Zero Flash on Load (Anti-FOUC):** Synchronous inline script in `index.html` evaluates `upiq_theme` and system `prefers-color-scheme` before HTML renders.
* **Accessibility:** All typography and controls satisfy WCAG AA/AAA contrast guidelines (> 14:1 for text, > 4.5:1 for buttons).

---

## 3. Architecture & Strict Constraints

1. **Zero Backend Modifications:** No backend routes, controllers, entities, migrations, or configurations were modified. All enhancements operate strictly within frontend boundaries.
2. **Deterministic Navigation:** The active application utilizes `FinancialContext` (`currentView` and `activeTab`) with lazy-loaded code-split components wrapped in `Suspense` and `LazyPageErrorBoundary`.

---

## 4. Manual Testing Checklist

| Task | Test Scenario | Expected Outcome | Status |
|---|---|---|---|
| **T1: CSV Upload** | Upload valid `.csv` statement | Parses rows, previews columns, imports via backend with count summary | Passed |
| **T1: CSV Upload** | Upload 0-byte or `.exe` file | Blocks upload immediately with accessible error toast/message | Passed |
| **T2: Consistency** | Create/Edit/Delete transaction | Dashboard KPIs, category pie charts, and ledger list refetch immediately | Passed |
| **T3: Budgets** | Set budget, switch users | Budgets are isolated per user account; export/import JSON works seamlessly | Passed |
| **T4: Session** | Tamper token in localStorage | Next action or refresh redirects to Login with session expired toast | Passed |
| **T5: Reports** | Download PDF report | Report snapshot is saved to local history table with preview & delete actions | Passed |
| **T6: Labels** | Inspect estimates & assistant | Displays "Estimate (not AI prediction)" and disclaims Ollama requirements | Passed |
| **T7: Themes** | Toggle Light, Dark, System | UI changes instantly; Light mode is pure white canvas; refresh has zero FOUC | Passed |
| **T8: QA** | `npm test` & `npm run check` | 129 tests pass; 0 warnings, 0 errors | Passed |

---

## 5. Items Requiring Backend Changes (BLOCKED)

The following capabilities are marked in the UI as **"Coming soon"** or **"Saved on this device only"** because they require future backend implementation:
* **Backend Cloud Budget Sync:** Requires backend entity, table, and CRUD endpoints.
* **Scanned Image PDF OCR:** Backend parser requires an OCR engine (e.g. Tesseract) for image-only scans.
* **Report Database Archive:** Backend currently streams PDFs on-the-fly without database storage.
* **Google OAuth / Single Sign-On:** Backend auth controller only supports username/password credentials.
* **GNN Transaction Anomaly Model:** Requires separate microservice deployment.
* **Live Admin Telemetry:** Requires administrative telemetry and metrics endpoints.
* **Server Push Webhooks:** Requires WebPush / WebSocket backend support.
