# UPIQ 2.0 — Roadmap and implementation status

This roadmap describes repository evidence as of 2026-11-16. A source implementation or unit test does not prove live-provider behavior, PostgreSQL compatibility, or production readiness. See the [team handoff](UPIQ_2.0_TEAM_HANDOFF.md) for detailed findings and the [migration runbook](DATABASE_MIGRATION_RUNBOOK.md) for database release procedures.

## Current implementation map

| Area | Status | Relevant code |
|---|---|---|
| Email/password auth, JWT, roles | Implemented; password login and registration are covered by tests. Production secret/CORS configuration fails closed. | `backend/src/main/java/com/upiq/auth/`, `backend/src/main/java/com/upiq/config/`, `frontend/src/utils/authFlow.js` |
| Google Sign-In | Implemented as optional Google OIDC; no live Google credential/provider verification in the latest recorded test run. Existing-email auto-linking is intentionally refused. | `backend/src/main/java/com/upiq/auth/config/`, `GoogleAccountService.java`, `GoogleLoginHandoffService.java`, `frontend/src/utils/googlePopup.js` |
| Profile/account management | Partial; authenticated profile read exists, but profile edits are browser-local and there is no backend update endpoint. | `UserController.java`, `frontend/src/pages/Profile.jsx`, `frontend/src/context/FinancialContext.jsx` |
| Transactions/categories/categorization | Implemented; transaction and category ownership is enforced by principal-scoped queries and service checks. Categorization is deterministic. | `backend/src/main/java/com/upiq/transaction/`, `category/`, `frontend/src/pages/Transactions.jsx`, `Categories.jsx` |
| CSV/PDF import | Implemented for supported CSV headers and digital text PDFs; source-row/rejection accounting and idempotent import exist. No OCR. | `backend/src/main/java/com/upiq/pdf/`, `frontend/src/utils/statementImport.js`, `StatementUploadModal.jsx` |
| Dashboard/reports | Implemented; backend calculations are per-user and deterministic; report endpoint streams PDF. Browser report history is local. | `backend/src/main/java/com/upiq/financial/dashboard/`, `report/`, `frontend/src/pages/Reports.jsx` |
| Budgets | Backend account-scoped monthly CRUD and local/demo fallback exist. V4 persistence and Hibernate validation have not been PostgreSQL-verified. | `backend/src/main/java/com/upiq/budget/`, `frontend/src/context/BudgetContext.jsx`, `V4__user_budgets_and_persistent_notifications.sql` |
| Notifications | Persistent, user-owned inbox; eligible alerts are generated on inbox access and can be read/dismissed. No scheduler or push/email delivery. | `backend/src/main/java/com/upiq/notifications/`, V4 migration, `frontend/src/services/notification.service.js` |
| Financial Insights | Deterministic user-ledger metrics with optional constrained qualitative Ollama explanation. | `backend/src/main/java/com/upiq/financial/insights/`, `frontend/src/pages/Insights.jsx` |
| Financial Chat | Bounded intent resolution and deterministic financial context; Ollama generates answer text. History is in-memory frontend state, not durable backend history. | `backend/src/main/java/com/upiq/financial/chat/`, `research/context/`, `frontend/src/pages/AIAssistant.jsx`, `chatSession.js` |
| Investment suggestions | Deterministic current-month cash-flow summary with general educational prompts and a disclaimer; not suitability advice or return prediction. | `backend/src/main/java/com/upiq/financial/investments/`, `frontend/src/components/insights/InvestmentSuggestions.jsx` |
| Fraud review | Deterministic large-amount, category-spike, and duplicate signals with reasons/risk levels. Flags are not proof or transaction blocks. | `backend/src/main/java/com/upiq/fraud/`, `frontend/src/components/insights/FraudAlertDrawer.jsx` |
| Voice assistant | Browser-native speech recognition and synthesis feed the existing authenticated chat flow. Browser/permission/privacy behavior varies. | `frontend/src/utils/voiceAssistant.js`, `frontend/src/pages/AIAssistant.jsx` |
| Admin dashboard | Admin-protected database aggregate endpoint and read-only account directory. No account-status mutation or operational telemetry. | `backend/src/main/java/com/upiq/admin/`, `UserController.java`, `frontend/src/pages/Admin.jsx` |
| Database migrations | Flyway V1–V4 and Hibernate `validate` configuration exist. PostgreSQL migration and validation remain release gates. | `backend/src/main/resources/db/migration/`, `application*.yml` |

## Phase 0 — Database and release safety (P0)

### V1–V4 PostgreSQL verification

**Status:** pending. Migration SQL exists but the current worktree has not completed a fresh PostgreSQL V1–V4 migration plus Hibernate `ddl-auto: validate`. An existing application database has not been migrated.

**Work:** establish an isolated PostgreSQL 16 test path with a dedicated role; verify fresh migration success and V4 persistence; test synthetic two-user ownership; verify amount precision, email normalization, constraints/indexes, and migration failure guards. Do not use the existing application database or volume.

For an existing pre-Flyway schema, take and test an approved backup, compare the schema to V1, manually baseline at version 1 only after review, then run V2–V4. Do not enable baseline-on-migrate or assume a baseline marker checks schema compatibility. The runbook documents the intended sequence and current limits.

### Existing-database rollout

V1 is the fresh-install baseline; V2 converts validated amounts to `NUMERIC(19,2)`; V3 normalizes/indexes emails; V4 adds user-owned budgets and notifications. Before rollout, verify sequences, row counts, indexes, constraints, amounts, duplicate email preconditions, and post-migration aggregates. A deployment rollback is not a schema rollback; agree on backup/PITR recovery with the database operator.

### Production configuration

Production requires externally provisioned datasource settings, a suitable JWT key, and explicit CORS origins. JWT configuration checks presence/byte length/HMAC compatibility and rejects the known development fallback; it cannot prove randomness. Production CORS rejects missing, malformed, or wildcard origins. Admin bootstrap is opt-in; the operator must disable its flag and remove temporary values after provisioning. Never put server secrets in frontend variables.

**Acceptance:** isolated PG V1–V4 and Hibernate validation pass; the existing-database baseline plan has operator approval; pre/post checks and recovery are documented; production configuration is exercised without exposing values.

## Phase 1 — Core workflow verification (P1)

### Statement parser coverage

**Status:** supported parsing/import flows exist. CSV and digital-PDF fixtures cover common validation paths, including strict amount grouping/dates and rejected-row metadata; parser matching remains heuristic.

**Work:** add representative synthetic fixtures for more bank layouts, multi-page PDFs, row continuation, duplicate imports, mixed valid/rejected rows, and persistence failures. Keep PDF coverage distinct from CSV semantics. OCR for scanned images is not implemented; consider it only after a privacy/retention review.

**Acceptance:** valid rows persist exactly once; invalid rows remain accounted for and never persist; source indexes/reasons are stable; user isolation is tested against PostgreSQL; OCR is not claimed unless implemented and tested.

### Runtime/authenticated regression

**Status:** source and focused tests exist, but no full browser-to-PostgreSQL workflow was run in the latest verification.

**Work:** verify registration/login, Google OIDC with approved test credentials, transaction CRUD/import, categorization, dashboard/report, budgets, notifications, insights, chat, admin denials, and voice permission/unsupported states in an isolated staging environment.

**Acceptance:** authenticated user A cannot read/write user B's financial data; failed API mutations do not appear successful in the UI; success/count responses match backend results.

## Phase 2 — Profile and persistent conversation decisions (P2)

### Profile updates

**Status:** profile GET exists; frontend edits update local state only. No profile write API exists.

**Work:** define editable fields, uniqueness/verification requirements, audit/privacy expectations, and server validation; add authenticated owner-only update endpoint only after those requirements are approved.

**Acceptance:** changes persist across devices and sessions, cannot change roles, and email changes have a verification/uniqueness flow.

### Chat retention

**Status:** messages are keyed by session/user in frontend state and survive in-app page navigation; logout/session expiry clears them. Reload/browser restart loses history; there is no server chat-history table/API.

**Work:** decide whether durable history is needed. If yes, define deletion, retention, encryption/access, user isolation, and prompt-data minimization before schema/API work.

## Phase 3 — Budgets, forecasts, and notifications (P2)

### Budgets and forecasts

**Status:** account-scoped budget endpoints and a V4 table are implemented in source; local/demo budget behavior remains. PostgreSQL persistence has not been verified. Month-end projections are simple run-rate calculations, not AI predictions.

**Work:** complete migration and two-user tests; define timezone/month semantics; validate edits/imports and zero/empty cases; evaluate an advanced forecast only after an accurate data baseline and uncertainty approach are defined.

**Acceptance:** CRUD is persistent and isolated, arithmetic stays decimal-safe, duplicate month/category budgets are rejected consistently, and forecasts disclose their simple assumptions.

### Notification delivery

**Status:** persisted records, user scoping, event-key deduplication, read/dismiss actions, and budget/spending thresholds are implemented. The inbox request triggers eligible generation. Scheduling, push/email, preferences, and quiet hours do not exist.

**Work:** decide whether event-driven background generation or external delivery is required; define consent, frequency, retention, and sensitive-content policy before adding a scheduler/provider.

**Acceptance:** no duplicate event records, owner-only access, explicit delivery failures/preferences if delivery is added, and no sensitive lock-screen content by default.

## Phase 4 — AI quality and reliability (P1/P2)

**Status:** Financial Chat uses bounded intents, deterministic calculations, and verified user-scoped context. Ollama is optional for answer text. Insights/investment numeric results are deterministic; qualitative explanations can fall back if Ollama is unavailable. No score/statistical evaluation supports claims of answer quality.

**Work:** maintain explicit supported/unsupported intents; expand only with deterministic formulas and test fixtures; verify user isolation and model unavailability; measure queue/connect/generation time; keep raw transactions and unnecessary identifiers out of prompts; evaluate outputs for unsupported claims. Ollama live tests remain opt-in and require a permitted loopback/network environment.

**Historical performance observation:** earlier synthetic runs against local `llama3.1:8b` observed answer generation around 35–57 seconds for tested long responses; fixed token caps truncated some answers and were not kept. This is historical, not a current latency guarantee. Re-measure in the intended runtime before making performance claims.

## Phase 5 — Investment, fraud, and admin follow-up (P2/P3)

### Investment Suggestions

**Status:** implemented as deterministic current-month cash-flow summaries and general education. It is not a personalized portfolio/suitability recommendation service and does not guarantee returns.

**Work:** gather product/legal/privacy approval before expanding to personalized recommendations or instrument/market data. Keep any numbers calculated and sourced deterministically.

### Fraud review

**Status:** deterministic rules flag high amounts, category spikes, and possible duplicate expenses with explanations. Alerts are not a trained fraud model, proof of fraud, or payment block. Some review signals are also inserted into the persistent notification inbox.

**Work:** review false positives with synthetic data and risk owners; define whether resolution/feedback should persist and how incidents are audited. Do not add a model or external service without privacy/product approval.

### Admin operations

**Status:** `GET /api/admin/dashboard` returns aggregate platform metrics and is admin-only. The separate `/api/v1/users` directory/lookups are admin-protected. Frontend is read-only and shows account status but cannot change it. No transaction-level monitoring, service/model telemetry, audit-event history, or retraining controls are implemented.

**Work:** define least-privilege admin roles, audit requirements, and approved actions before adding account controls or operational telemetry. Preserve aggregate-only dashboard privacy.

## Phase 6 — Voice, browser behavior, and research evaluation (P3)

### Voice

**Status:** browser-native speech input/playback is implemented through existing authenticated Financial Chat. Recognition is configured for English (India); microphone permission and browser speech APIs are required. Speech recognition may be provided by the browser/vendor and is not guaranteed to run entirely on device.

**Work:** document supported browser versions/privacy behavior, test denied permission/unsupported APIs, and verify keyboard/screen-reader access. Do not add paid speech services without product approval.

### Research

**Status:** the A/B/C benchmark runner and synthetic data are checked in; answer-quality scoring and statistical conclusions are not.

**Work:** define ground truth, evaluation protocol, blinded review, and sample-size plan; separate generation failure from inaccurate response; keep live runs synthetic, bounded, and output paths unique.

**Selected synthetic fixture references:** Q001 Food August 2026 total 3,620.00 (8 transactions, 27.50%); Q006 July/August totals 11,356.00/13,166.00 (difference 1,810.00, 15.94%); Q011 largest August expense 2,100.00. These are fixture facts, not user financial data or model-quality results. Resources: `backend/src/main/resources/research/questions/benchmark-questions.json`, `dataset/profiles.json`, `dataset/transactions.json`, `experiment-case-selection.json`; fixture adapter: `backend/src/test/java/com/upiq/research/experiment/Checkpoint4ECaseFixture.java`.

## Development and verification notes

- Root `docker-compose.yml` starts PostgreSQL and backend; frontend runs separately through Vite. The nested Docker Compose file is not the root development stack.
- Root `.env.example` is for Compose interpolation, `backend/.env.example` is for backend environment setup, and `frontend/.env.example` contains public Vite values only.
- Backend: from `backend`, run `.\mvnw.cmd test`. Frontend: from `frontend`, run `npm test`, `npm run lint`, and `npm run build`. Frontend tests use Node's built-in `node --test`; no browser end-to-end framework is configured.
- Latest recorded verification: frontend 193 passed and build passed; backend 334 tests, 0 assertion failures, 5 Ollama loopback setup errors, 3 skipped. The backend suite is not fully passing. Database migration/schema validation remains unverified.
- Keep `.env`, credentials, `node_modules`, `target`, `dist`, model files, and local experiment output out of version control. Preserve unrelated untracked work; do not use cleanup commands as part of routine verification.
