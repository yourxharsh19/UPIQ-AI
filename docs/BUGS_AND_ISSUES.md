# UPIQ 2.0 — Bugs, risks, and verification status

**Review date:** 2026-11-16 | **Branch:** `main`
**Evidence rule:** findings below distinguish confirmed current limitations from unverified risks and historical incidents. A source implementation or focused test does not establish production runtime behavior.

## High-priority release gates

| ID | Finding | Impact / evidence | Status and next step |
|---|---|---|---|
| H-01 | Flyway V1–V4 and Hibernate schema validation are not verified against PostgreSQL for the current worktree. | V1–V4 source files exist and all profiles use `ddl-auto: validate`, but no completed isolated PostgreSQL V1→V4 plus backend startup/validation result exists. An isolated startup attempt stopped at Flyway connection authentication; it did not verify schema behavior. | **Open release gate.** Run fresh-install and legacy-baseline verification against a separate disposable PostgreSQL 16 database. |
| H-02 | The existing application database has not been migrated or baseline-verified. | Existing schemas must be compared to V1 and manually baselined at version 1 before V2–V4. No existing database was modified in this work. | **Open release gate.** Require a verified backup/restore, schema comparison, V2/V3 precondition checks, operator approval, and post-migration validation. See [runbook](DATABASE_MIGRATION_RUNBOOK.md). |
| H-03 | Backend full suite does not currently complete cleanly in this environment. | 334 tests ran with 0 assertion failures, 5 errors, and 3 skipped. All five errors are `OllamaClientTest` loopback server creation failures (`Unable to establish loopback connection`, `SocketException: Permission denied: connect`). | **Open verification gate.** Run the same assertions in an environment that permits loopback sockets; do not skip or weaken them. |

These are release gates, not confirmed source-code defects. No Critical issue was confirmed by the latest recorded source review.

## Confirmed limitations and deferred issues

| ID | Priority | Area | Description | Status |
|---|---|---|---|---|
| M-01 | Medium | Profile | `FinancialContext.updateProfile()` updates browser-local profile state. There is no backend profile update endpoint, so edits do not synchronize across devices or persist as account changes. | Deferred; define server-side editable fields and verification rules. |
| M-02 | Medium | Chat | Chat history is stored in in-memory frontend context keyed by session/user. It survives app navigation and is cleared on logout/session expiry, but does not survive reload/browser restart and is not server-persisted. | Deferred; decide retention, deletion, and privacy policy before adding durable storage. |
| M-03 | Medium | Notifications | Budget/spending notifications are generated when the inbox is accessed. Read/dismiss state is persisted by V4; there is no scheduler, push/email delivery, quiet-hours, or preferences API. | Deferred; product/platform decision. |
| M-04 | Medium | Rate limiting | Authentication rate limiting is process-local and uses a bounded 10,000-entry map; LRU eviction can reset an active counter. Replicas do not share state. Only the socket remote address is trusted. | Deferred; review reverse-proxy topology and use a gateway/shared limiter before scaling. |
| M-05 | Medium | Google OIDC | Handoff tickets are kept in memory and OAuth authorization state uses servlet session state. Separate instances/restarts do not share handoffs. | Deferred; session affinity is needed unless shared state is designed. |
| M-06 | Medium | Admin | Admin dashboard and account directory are read-only. User-status changes, transaction-level monitoring, audit-event history, and service/model telemetry are not implemented. | Deferred; define roles/audit scope before adding actions. |
| M-07 | Medium | Investment | Suggestions are general educational prompts based on deterministic current-month cash flow; there is no suitability/risk-profile assessment or guaranteed-return model. | Deliberate product limitation. |
| M-08 | Medium | Fraud | Alerts are deterministic review rules, not a trained prediction model, proof of fraud, or payment block. No durable user resolution workflow is implemented. | Deliberate product limitation; define false-positive and resolution policy before expansion. |
| L-01 | Low | Voice | Voice recognition/playback depend on browser APIs and microphone permission. Recognition may use a browser/vendor speech service and is not guaranteed to run on-device. | Document supported browser/privacy behavior; no paid provider is configured. |
| L-02 | Low | OCR | Scanned image-only PDF OCR/bill scanning is not implemented; PDFBox extracts text from digital PDFs. | Out of current scope. |

## Security and data-isolation notes

- Registration always assigns `ROLE_USER`; login errors are generic for unknown email, wrong password, and disabled accounts. BCrypt comparison reduces obvious path differences, but constant-time behavior is not guaranteed.
- JWT startup checks key presence, minimum UTF-8 byte length, known local fallback rejection in production, and HMAC compatibility. Byte length does not prove cryptographic randomness; deployment must supply a secure key through a secret manager.
- CORS production configuration requires explicit valid HTTP(S) origins, rejects wildcard/missing values, and disables credentials.
- Controllers/services derive ownership from the authenticated principal for financial operations. Admin endpoints are protected in the Spring Security chain/method security; frontend route hiding is not the security boundary.
- V1 legacy transactions/categories have `user_id` fields but no user foreign keys; ownership depends on application query/service enforcement. V4 adds cascading user foreign keys for budgets and notifications.
- Admin bootstrap is disabled by default and opt-in. The runner does not disable its environment flag automatically after provisioning; the operator must set it false and remove temporary values.

## Current API and persistence reference

| Feature | API paths | Persistence/calculation note |
|---|---|---|
| Authentication | `POST /api/auth/register`, `POST /api/auth/login` | Registration creates `USER`; JWT is returned in `data.token`. |
| Google OIDC | `GET /api/auth/google/status`, `POST /api/auth/google/exchange`, OAuth callback `/login/oauth2/code/google` | Optional provider flow, verified OIDC identity, one-use in-memory handoff. |
| User account | `GET /api/v1/users/me`; admin-only `/api/v1/users`, `/email/{email}`, `/username/{username}` | Read APIs only; profile write is not implemented. Directory omits password hashes. |
| Transactions | `/api/transactions`, `/api/transactions/{id}`, `/api/transactions/category/{category}` | Principal-scoped CRUD; amounts use BigDecimal and decimal-string JSON. |
| Categories | `/api/categories`, `/api/categories/{id}`, `/api/categories/type/{type}` | Principal-scoped category operations. |
| Statement import | `POST /api/pdf/upload`, `POST /api/pdf/import` | Preview does not persist; import is user-scoped/idempotent and reports imported/duplicate/rejected/failed counts. Backend accepts CSV/PDF; UI supports CSV/PDF. |
| Dashboard/report | `GET /api/financial/dashboard`, `GET /api/financial/report?month=YYYY-MM` | Deterministic user-scoped totals; report response is PDF bytes. |
| Budgets | `/api/budgets`, `/api/budgets/{id}` | User-owned monthly total/category budgets and calculations; V4 schema not PostgreSQL-verified. |
| Notifications | `/api/notifications`, `/unread-count`, `/{id}/read`, `/{id}/dismiss` | Persistent records, on-demand generation, user-scoped read/dismiss; depends on V4. |
| Insights/chat | `GET /api/financial-insights`, `POST /api/financial-chat` | Deterministic facts; optional Ollama explanation; chat intents are bounded. |
| Investment/fraud | `GET /api/investment-suggestions`, `GET /api/fraud-alerts` | User-scoped deterministic summaries/rules; explanatory/educational only. |
| Admin | `GET /api/admin/dashboard` | `ROLE_ADMIN` only; aggregate metrics, no transaction-level rows. |
| Health | `GET /health` | Public application health route. Other API health routes remain subject to the general authenticated rule unless explicitly permitted by `SecurityConfig`. |

The common JSON API envelope is `{ success, data, message }`; the financial report returns PDF bytes. Protected endpoints require a bearer JWT. See [README](../README.md) for the endpoint overview and [Authentication Setup](AUTHENTICATION_SETUP.md) for the provisioning flow.

## Historical findings and incidents retained

Earlier audits recorded fixes for public role escalation, admin-only user directory access, transaction ownership errors, generic exception messages/log fields, statement parser log sensitivity, malformed transaction amount/date validation, and active navigation. These are preserved in the current source/test history; the latest verification does not prove live deployment.

Historical runtime incidents remain unverified against the current runtime:

- Local Ollama requests previously reached long generation timeouts; later prompt-only concision work avoided fixed token caps that truncated test answers. Do not claim current latency is resolved without a live request.
- A stale backend container image was previously reported and resolved operationally at that time. This documentation update does not rebuild or restart services.
- A live authenticated transaction-save/dashboard-refresh smoke test was not part of the latest verification.
- A prior working-tree audit had older test counts (213 backend tests and 77 frontend tests). Those are historical and are superseded by the latest counts below.

## Latest recorded verification

- Backend full suite with the installed Byte Buddy agent preloaded: **334 tests, 0 assertion failures, 5 errors, 3 skipped; BUILD FAILURE.** The errors are all `OllamaClientTest` loopback-server environment errors. Skipped tests: `Checkpoint4ESmallBatchLiveTest`, `SystemBQ001RuntimeDiagnosticTest`, `SystemCLiveOllamaVerificationTest`.
- Frontend `npm test`: **193 passed, 0 failed, 0 skipped**.
- Frontend `npm run build`: **passed**.
- PostgreSQL migrations and Hibernate validation: **not verified** for V1–V4 in the current worktree.
- No authenticated browser E2E, live Google OAuth, or live Ollama verification was performed in the latest test run.

## Research observations preserved

The checked-in benchmark uses synthetic fixtures. Selected historical fixture values include Q001 Food August 2026 total 3,620.00 across 8 transactions (27.50%), Q006 July/August totals 11,356.00/13,166.00 (difference 1,810.00; 15.94%), and Q011 largest August expense 2,100.00. These are not user financial data or model-quality results. The A/B/C runner records raw answers/errors/latency and optional token/timing metadata but does not calculate answer-quality scores or statistical significance. Several unsupported benchmark calculation types are intentionally rejected.
