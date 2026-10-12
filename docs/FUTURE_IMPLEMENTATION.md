# UPIQ 2.0 — Future Implementation

This roadmap consolidates project plans and technical handover notes. Statuses describe current repository evidence, not a production guarantee. Priorities: **P0** release/security prerequisite, **P1** core data integrity, **P2** planned product capability, **P3** optional research/experience work.

## Current implementation map

UPIQ is a React/Vite single-page application backed by one Spring Boot REST application and PostgreSQL. Root `docker-compose.yml` runs PostgreSQL and the backend; the frontend runs separately through Vite unless a future deployment adds a frontend service.

| Area | Current status | Main modules |
|---|---|---|
| JWT login, registration, role checks, session cleanup | Implemented; registration creates `USER`; directory endpoints are admin-only | `backend/src/main/java/com/upiq/auth/`, `backend/src/main/java/com/upiq/config/`, `frontend/src/context/FinancialContext.jsx`, `frontend/src/services/api.js` |
| Transaction CRUD, owner scoping, deterministic categorization | Implemented | `backend/src/main/java/com/upiq/transaction/`, `backend/src/main/java/com/upiq/category/`, `frontend/src/pages/Transactions.jsx`, `frontend/src/context/FinancialContext.jsx` |
| Category management and browser-local monthly budgets | Partially implemented; budgets are localStorage-only | `frontend/src/pages/Categories.jsx`, `frontend/src/context/BudgetContext.jsx`, `frontend/src/hooks/useAIBudget.js` |
| PDF and backend CSV parsing/import | Partially implemented; browser accepts PDF only, text parsing is heuristic, no OCR | `backend/src/main/java/com/upiq/pdf/`, `frontend/src/pages/UploadPDF.jsx`, `frontend/src/utils/statementImport.js` |
| Dashboard, calculated report PDF, monthly CSV | Implemented with data-provenance/currency limitations | `backend/src/main/java/com/upiq/financial/dashboard/`, `backend/src/main/java/com/upiq/financial/report/`, `frontend/src/pages/Reports.jsx`, `frontend/src/utils/monthlyReport.js` |
| Financial Chat | Partially implemented: bounded intents, deterministic calculation, grounded Ollama explanation; not general advice | `backend/src/main/java/com/upiq/financial/chat/`, `backend/src/main/java/com/upiq/research/llm/`, `frontend/src/pages/AIAssistant.jsx`, `frontend/src/utils/financialChat.js` |
| Budget estimate | Implemented as a simple frontend run-rate estimate; not an AI prediction | `frontend/src/utils/budgetForecasts.js`, `frontend/src/hooks/useAIBudget.js`, `frontend/src/pages/Insights.jsx` |
| AI transaction categorization, fraud detection, investment advice, budget sync/AI prediction, push notifications | Planned; no corresponding production service/API today | Feature metadata in `frontend/src/services/backendFeatureStatus.js` |
| Voice | Speech output exists in the assistant; voice input is absent from the current worktree | `frontend/src/pages/AIAssistant.jsx` |
| Research A/B/C experiment runner | Implemented opt-in raw-result collection; no scoring/statistics | `backend/src/main/java/com/upiq/research/experiment/`, `backend/src/main/resources/research/` |

## Phase 0 — Release and data-safety foundations (P0)

### Production configuration and schema rollout

**Purpose:** Ensure production cannot start with known local credentials or silently mutate schema without a controlled rollout.

**Existing evidence:** `backend/src/main/resources/application.yml` contains local defaults for JWT/database settings; `application-prod.yml` still has `ddl-auto: update`; no migration tool is configured. Compose environment comes from the root template, while the frontend template is limited to Vite variables.

**Steps:** require a nonempty high-entropy JWT signing secret and database credentials under the production profile; add versioned migrations for schema changes; use a migration-first validation mode only after checking the real schema; document origin allowlisting for `SecurityConfig`.

**Acceptance:** a production-profile startup without required credentials fails closed; migration tests cover a clean schema and upgrade from a representative prior schema; no secret values enter frontend bundles or logs; configured browser origins are explicit and tested.

**Prerequisites:** identify the production database/schema and deployment environment. Do not change Hibernate mode until migration coverage exists.

### Monetary data semantics

**Purpose:** Prevent financial values and reports from presenting unsupported currency or precision claims.

**Existing evidence:** transaction amounts are `Double`; no transaction currency field or conversion service exists; report output labels INR while account display formatting is selectable.

**Steps:** choose and document an account/base currency contract; add currency to transaction storage/API/import flows if multi-currency is required; plan a decimal database migration; do not infer conversion rates from a display preference.

**Acceptance:** amounts use a fixed decimal representation; each displayed or reported total has a known currency; import/edit tests preserve currency; migration tests cover existing records without inventing provenance.

**Prerequisite:** product decision on whether accounts are single-currency or multi-currency.

## Phase 1 — Core ledger and imports (P1)

### Browser CSV statement import

**Status:** backend parser/import path exists; browser selection currently accepts PDF only.

**Purpose/behavior:** let users upload a supported CSV, preview parsed rows, correct/reject candidates, and persist only explicit user-approved rows.

**Relevant modules:** `ParserController`, `CSVParserService`, `StatementImportService`, `frontend/src/pages/UploadPDF.jsx`, `frontend/src/services/pdf.service.js`, `frontend/src/utils/statementImport.js`.

**Steps:** define supported headers and size limits; expose CSV in the UI; reuse the preview/correction flow; retain per-row duplicate/rejection/import results; keep user scoping and idempotent row identity; sanitize parser logs.

**Tests/acceptance:** header aliases, quoted delimiters, malformed rows, date/amount edge cases, duplicate upload, user isolation, preview edits, partial failures, and no import before confirmation. No parser row may silently become a current-date transaction.

### Parser accuracy and OCR

**Status:** planned. Current PDFBox path extracts text only and uses statement-dependent heuristics.

**Steps:** collect consented synthetic/anonymized fixtures from supported layouts; report confidence and ambiguous fields; consider OCR only with privacy/storage/retention controls; keep user review before save.

**Acceptance:** fixture-based parsing precision/recall is measured per field and format; low-confidence candidates are visibly flagged; scan/image PDFs are not reported as successfully parsed when no text is extracted.

## Phase 2 — Explainable categorization assistance (P2)

### AI-powered transaction categorization

**Status:** planned. Current `SmartCategorizationService` is deterministic rule/phrase matching and returns `Uncategorized` when confidence is low. It does not call an AI model.

**Purpose/behavior:** optionally propose a category from a controlled per-user category list when deterministic rules cannot confidently assign one; never silently override an explicit user category.

**Implementation steps:**

1. Measure deterministic misclassification and abstention using consented, de-identified fixtures.
2. Define an allowlisted category schema, confidence threshold, timeout, and safe abstain path.
3. Evaluate local Ollama or another approved model without sending unnecessary identifiers or full account history.
4. Present low-confidence proposals for user confirmation; record whether the suggestion was accepted only if the user opts in.
5. Preserve deterministic rules as fallback and provide a way to correct categories.

**Tests/acceptance:** known fixtures yield schema-valid categories; ambiguous/unknown/timeout/malformed output abstains; explicit category edits win; one user's category data never appears in another user's prompt; no suggestion is represented as verified fact.

**Prerequisites:** privacy review, model/runtime capacity, baseline labeled fixtures, and product approval for any external model provider.

## Phase 3 — Durable budgets and validated forecasts (P2)

### Cloud budget sync

**Status:** planned; current budgets use browser localStorage.

**Purpose/behavior:** persist category/month budgets under the authenticated owner so preferences can follow an account across devices.

**Steps:** decide month/currency/category semantics; add owner-scoped schema and CRUD endpoints with migrations; handle local-to-server merge conflicts; preserve read-only local behavior offline; never sync across users.

**Tests/acceptance:** authorization tests for every operation, migration tests, merge/conflict and offline tests, month-boundary tests, and verified persistence across sessions/devices.

### Advanced budget prediction

**Status:** planned. Current estimate extrapolates current-month spending locally; it is not AI-generated or server-validated.

**Purpose/behavior:** offer a clearly labeled forecast with horizon, inputs, uncertainty, and known missing-data limitations.

**Steps:** first establish reliable currency and complete transaction-history coverage; define baselines and evaluation protocol; compare simple statistical baselines before considering ML; show uncertainty and exclude sparse/incomplete histories.

**Tests/acceptance:** held-out time-based evaluation, cold-start and sparse-history behavior, month/year/time-zone boundaries, reproducibility, and user-visible disclosure that a forecast is not guaranteed. Do not cap output or call truncation a complete result in any AI explanation.

**Prerequisites:** durable budgets/history, currency semantics, and a measured baseline. No model choice or performance claim is established now.

## Phase 4 — Financial Assistant quality and reliability (P1/P2)

**Status:** bounded intents and grounded System C are implemented. `FinancialChatIntentResolver` selects supported questions; deterministic services compute financial facts; `SystemCService` uses verified context; generic education follows a separate prompt. Ollama retry policy has at most two attempts; default timeout is 60 seconds and frontend Financial Chat timeout is 125 seconds.

**Planned work:** expand intents only with deterministic formulas and explicit unsupported responses; preserve the provenance/definitions shown with answers; keep raw transactions out of model prompts when aggregate facts suffice; measure prompt/load/generation time separately; add cancellable bounded live tests; retain a clear service-unavailable result when generation times out.

**Tests/acceptance:** intent resolver/dispatcher tests, per-user isolation, no invented currency/merchant claims, short/unsupported/no-data/Ollama-error cases, output completeness review, and timeout tests using deterministic transport mocks. Live Ollama tests remain opt-in and synthetic; hard-bound the external process and never claim a chat is fixed until an authenticated real request succeeds.

**Prior observed performance:** local `llama3.1:8b` produced warm synthetic answers around 5.9 generated tokens/second; uncapped 212–307 token answers could take roughly 35–57 seconds. Limits of 160 and 256 tokens truncated tested responses, so prompt-only concision was selected; do not introduce a fixed output cap without `done_reason` detection and quality evaluation.

## Phase 5 — Security monitoring, admin observability, and notifications (P2/P3)

### Fraud/unusual-transaction detection

**Status:** planned; current Insights says fraud monitoring is upcoming. No detector, risk API, or dispute workflow is implemented.

**Steps:** define user-consented signals and false-positive handling; start with interpretable deterministic rules; isolate any model service; present alerts as review suggestions, never as proof of fraud; add dismiss/feedback and incident audit controls.

**Acceptance:** synthetic known/unknown anomaly fixtures, bias/false-positive review, per-user isolation, explainable signal details, and no claim of a blocked transaction unless the payment rail actually rejected it.

The earlier feature list mentioned a Graph Neural Network microservice as one possible architecture. That is an unvalidated proposal, not an implementation choice; compare it with simpler explainable baselines before selecting a model or adding a service.

### Investment recommendations

**Status:** planned only; there is no investment/portfolio recommendation service or validated investment data model.

**Steps:** decide whether this product should offer educational information or personalized recommendations; obtain legal/privacy review before personalized advice; document supported instruments, assumptions, risk tolerance, and suitability boundaries; avoid claiming returns or executing trades.

**Acceptance:** explanations cite input data and uncertainty, never invent holdings/market data, and clearly distinguish education from advice. Do not expose the feature as active until a reviewed backend contract and evaluation process exist.

### Admin telemetry and alerts

**Status:** planned; Admin view explicitly says live telemetry/admin APIs are unavailable. Role checks protect the UI/API but there are no operational metrics endpoints.

**Steps:** define least-privilege admin scopes, aggregate-only observability, retention controls, and alert ownership; add server-side admin authorization and audit event tests before displaying live counts.

**Acceptance:** non-admin access denied at API level; no transaction content in metrics/logs; displayed values link to an actual supported service endpoint.

### Notifications and voice

**Status:** planned for persistent server push and smart notifications; browser speech output exists, voice input is not present.

**Steps:** implement only after consent, notification preference and delivery policy are defined; support budget reminders first; voice input requires browser support disclosure and explicit microphone permission.

**Acceptance:** opt-in/out, quiet hours, no sensitive amounts on lock screens by default, delivery-failure states, keyboard/screen-reader access, and browser permission-denied coverage.

## Phase 6 — Research evaluation and contributor workflow (P3)

**Status:** the A/B/C benchmark runner and synthetic data are checked in; answer-quality scoring and statistics are not.

**Steps:** define preregistered questions/metrics, ground truth, blind review, and a sample-size plan; maintain prompt/model/runtime metadata; use unique result filenames; separate exploratory runs from claims.

**Acceptance:** reproducible fixture calculations; explicit distinction between generation failures and incorrect answers; answer-completeness/grounding metrics; confidence intervals or other justified statistics before making system comparisons.

**Selected fixture references:** Q001 Food August 2026 total 3,620.00 (8 transactions, 27.50%); Q006 July/August 11,356.00/13,166.00 (difference 1,810.00, 15.94%); Q011 largest August expense 2,100.00. Fixture data is synthetic. Resources: `backend/src/main/resources/research/questions/benchmark-questions.json`, `dataset/profiles.json`, `dataset/transactions.json`, `experiment-case-selection.json`; deterministic fixture adapter: `backend/src/test/java/com/upiq/research/experiment/Checkpoint4ECaseFixture.java`.

## Repository development and verification notes

- Root Compose starts PostgreSQL and backend only; Vite runs separately in local development. Use root `docker-compose.yml` and the configured project name when operating the existing deployment; never assume the nested Compose file matches runtime configuration.
- Environment templates: root `.env.example` for Compose; `backend/.env.example` for backend development; `frontend/.env.example` only for Vite `VITE_*` settings. Never put server secrets in frontend env files or bundle variables.
- Backend checks: `cd backend; .\mvnw.cmd test` where Maven Wrapper is available. Frontend checks: `cd frontend; npm test; npm run build; npm run lint`. The current frontend unit convention is Node's built-in `node --test`; there is no configured browser end-to-end framework.
- Keep migrations, tests, dependency manifests/lockfiles, active benchmark JSON resources, and opt-in experiment fixtures. `research-results/` is Git-ignored runtime output; preserve local artifacts unless their owner explicitly requests deletion.
- Before publishing: inspect `git status`, run relevant suites and `git diff --check`, keep `.env`, credentials, `node_modules`, `target`, `dist`, model files, and local result artifacts out of versioned changes. Do not delete unrelated untracked user work as cleanup.
