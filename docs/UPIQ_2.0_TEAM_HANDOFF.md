# UPIQ 2.0 Team Handoff

**Review date:** 2026-11-16 | **Repository/branch:** `UPIQ-2.0`, `main`
**Scope:** Current source and worktree review. No live application or database operations were performed.

## A. Project overview

UPIQ 2.0 is a personal finance application with a React 19/Vite frontend and a Java 21/Spring Boot 3.3.1 backend. PostgreSQL is the production database. Spring Data JPA/Flyway manage persistence; Spring Security protects API routes; JWT supports stateless sessions; optional Google OIDC and Ollama integrations provide sign-in and qualitative AI explanations. Financial transaction values are INR-only and use `BigDecimal` in the backend and decimal strings/BigInt minor-unit arithmetic in the frontend.

The current worktree contains pre-existing uncommitted implementation work, including the Budget, persistent Notification, Investment Suggestions, and Fraud Detection additions and Flyway V4. The worktree was preserved. The running application/database were not inspected, restarted, or modified.

## B. Executive summary

### Critical issues

No Critical source-code defect was confirmed in this review. The inspected API controllers obtain the user from the authenticated principal for user financial operations; admin dashboard access is protected by `hasRole('ADMIN')`; JWT and production CORS configuration validate required settings at startup.

### High issues and release blockers

No safely fixable Critical/High code defect was confirmed. One **High release verification blocker** remains: the production PostgreSQL migration path and Hibernate validation have not been demonstrated on a disposable PostgreSQL database for V1–V4. Earlier isolated verification attempts could not authenticate through the Windows host-port route; they did not establish a schema or migration defect. The existing application database was not migrated, and this review did not connect to it.

Existing databases require a reviewed schema comparison and manual Flyway baseline before startup migration. Do not assume that a successful Maven build or unit test proves database compatibility. The current `docs/DATABASE_MIGRATION_RUNBOOK.md` still describes only V1–V3 even though V4 exists; see deferred issue M-01.

### Readiness

**Not ready for production release.** The source has broad feature coverage and frontend checks pass, but V4/PostgreSQL compatibility, existing-database baseline readiness, and the full backend test result remain unresolved. It is suitable for continued isolated staging verification after those release gates are addressed.

## C. Feature implementation matrix

“Implemented” describes the core behavior and available focused verification, not live production verification. Backend tests are unit/MVC tests unless explicitly stated; no PostgreSQL integration suite was run in this review.

| Feature | Status | Verified behavior and evidence | Remaining work / limitations |
|---|---|---|---|
| Registration and login | **Implemented** | `AuthController`, `AuthService`, `UserServiceImpl`; registration, BCrypt password storage, normalized email lookup, generic duplicate-registration response, generic invalid-login response. `AuthServiceRegistrationTest`, `AuthServiceLoginTest`, and `AuthControllerRegistrationTest` are in the backend suite. | Not exercised against the current PostgreSQL deployment. Unknown-email and wrong-password paths still have different lookup work; generic response text does not prove timing equivalence. |
| Google authentication | **Partially Implemented** | Optional Google OIDC configuration, `/api/auth/google/status`, handoff exchange, verified-email requirement, and normal-user role assignment exist in `GoogleOAuthConfiguration`, `GoogleAccountService`, `GoogleLoginHandoffService`, and frontend login flow. Focused Google configuration/state/handler tests passed in the backend suite; frontend popup tests are included in `npm test`. | No live Google provider/browser test was run. Existing-account email linking is intentionally refused. Handoff tickets are in-memory and do not support multi-instance/restart continuity. |
| User profile and account management | **Partially Implemented** | Authenticated profile lookup is available at `GET /api/v1/users/me`; frontend hydrates profile data in `FinancialContext`. | `FinancialContext.updateProfile()` saves profile edits only to browser local storage and displays a success toast; there is no backend profile update endpoint. Account changes do not persist to the server. |
| Transaction management | **Implemented** | Authenticated CRUD in `TransactionController` and `TransactionServiceImpl`; transaction mutations and reads use the principal’s user ID and ownership checks. Amounts are `BigDecimal`, positive, and bounded. Categorization and transaction validation tests are in the backend suite; frontend transaction tests pass. | No live PostgreSQL/API test in this review. Timestamps are `LocalDateTime` without timezone, so deployment timezone policy must remain consistent. |
| Statement import | **Implemented** | Authenticated `/api/pdf/upload` preview and `/api/pdf/import`; CSV/PDF parsing, row validation, rejection metadata, user-scoped idempotent persistence, and accounting are implemented in `CSVParserService`, `AIPDFParserService`, and `StatementImportService`. Backend parser/import tests and frontend statement tests are in the suites. | Supported statement layouts are heuristic and fixture-bounded. No live database persistence or bank-format certification was run. |
| Automatic categorization | **Implemented** | Deterministic categorization plus optional model-backed categorization in `SmartCategorizationService` and `TransactionServiceImpl`; category ownership is scoped to the user. Categorization tests passed in the backend suite. | Existing transactions may require explicit “categorize uncategorized” action; categories are not guaranteed to match every merchant. |
| Dashboard | **Implemented** | `/api/financial/dashboard` uses per-user transaction queries and deterministic financial calculations; frontend dashboard consumes backend summaries and preserves decimal strings. Dashboard and calculation tests are in the backend suite. | Aggregates have not been checked against a real PostgreSQL fixture in this review; timezone/month convention needs an explicit deployment policy. |
| Budget management | **Partially Implemented** | Authenticated CRUD at `/api/budgets`; category and total monthly limits, current spend, remaining amount, and projection use `BigDecimal`. `BudgetServiceTest` and frontend budget API tests are present. V4 creates `budgets`. | Persistence, uniqueness, migration, and Hibernate mapping have not been verified on PostgreSQL. Budget periods use server-local `YearMonth.now()`. |
| Smart notifications | **Partially Implemented** | Authenticated `/api/notifications` inbox, unread count, read/dismiss operations, user-scoped repository lookups, deduplication key, and V4 persistent table exist. Budget threshold and prior-month spending signals are deterministic; `NotificationServiceTest` is present. | Generation occurs when the inbox is requested; there is no scheduler, push, email, or event-triggered background delivery. V4 persistence is not PostgreSQL-verified. |
| AI insights | **Partially Implemented** | Authenticated `/api/financial-insights`; income, expense, net, month comparison, category breakdown, and budget facts are calculated deterministically from the principal’s ledger. Ollama is used only for a constrained qualitative explanation with a deterministic fallback. `FinancialInsightsServiceTest` is present. | No live Ollama or PostgreSQL test was run. Qualitative model text still requires monitoring; it is filtered but remains model-generated language. |
| Financial AI chat | **Partially Implemented** | Authenticated `/api/financial-chat`; supported financial intents route to deterministic calculations and verified user-scoped context before Ollama explanation. Unsupported questions and Ollama failures have controlled responses. Chat/service tests are present. | The LLM can still phrase a response incorrectly despite grounded facts; supported intents are limited. No live model/DB test was run. |
| Chat history retention | **Partially Implemented** | `FinancialContext` stores messages in app-level React state keyed by user/session; page navigation preserves the state and logout/session-expiry clears it. `chatSession.js` has focused tests. | History is not persisted to backend or browser storage and is lost on page reload/browser restart. |
| Reports and analytics | **Implemented** | Authenticated `/api/financial/report` generates a PDF from deterministic calculations; research calculation APIs and frontend report views are present. Financial report and calculation tests are in the backend suite; frontend report tests are included. | Report history/preview metadata is device-local. No PDF/database end-to-end verification was run. |
| Investment suggestions | **Partially Implemented** | Authenticated `/api/investment-suggestions`; deterministic current-month cash-flow/surplus and fixed educational suggestions. Ollama may provide a constrained explanation only. Response includes an education/not-advice disclaimer. `InvestmentSuggestionsServiceTest` is present. | Suggestions are general education, not goal/risk-profile-based planning. No live PostgreSQL/Ollama test was run. |
| Fraud detection | **Partially Implemented** | Authenticated `/api/fraud-alerts`; user-scoped deterministic large-amount, category-spike, and duplicate-expense review signals with reasons and risk labels. Alerts can create deduplicated inbox notifications. `FraudDetectionServiceTest` and frontend alert tests are present. | Signals do not establish fraud or block transactions. There is no durable user resolution workflow; thresholds are heuristic and should be tuned with product approval. |
| Voice assistant | **Partially Implemented** | Browser-native speech recognition sends recognized text through the existing authenticated chat flow; browser text-to-speech playback and stop controls exist in `AIAssistant.jsx`/`voiceAssistant.js`. Frontend tests cover helper behavior and controls. | Recognition support varies by browser and may use browser-vendor services. No real microphone/browser permission test was run; English (India) is configured. |
| Admin dashboard | **Partially Implemented** | `GET /api/admin/dashboard` returns database aggregate counts/totals and is protected by `@PreAuthorize("hasRole('ADMIN')")`. Admin user-directory access is separately role-protected at `/api/v1/users`. The summary avoids exposing transaction-level rows; admin security/service tests are present. | Current UI is read-only. No account status changes, transaction monitoring, system configuration, notification operations, or health telemetry are implemented. No real PostgreSQL aggregate verification was run. |
| Role and permission management | **Partially Implemented** | USER/ADMIN roles are assigned in auth flows; JWT filter reloads the user and current role from the database; admin methods use method security. Admin bootstrap is opt-in and disabled when its property is absent. Security integration tests are in the suite. | No role-management UI/API exists; bootstrap is the only initial-admin provisioning path. Role changes require an operator/database process. |
| Security and data isolation | **Implemented** | Global authentication requirement, JWT expiry/signature validation, explicit 401/403 API response handlers, explicit-origin CORS validation, bounded process-local login/register rate limiting, and user-scoped service queries are present. Security response/admin/user endpoint tests are in the backend suite. | No penetration test or live multi-user PostgreSQL isolation test was performed. Rate limiting is process-local and trusts the socket remote address; proxy deployment needs explicit topology review. |
| Database migrations and production configuration | **Partially Implemented** | Flyway V1–V4 exist; all application profiles use `ddl-auto: validate`; production datasource/JWT/CORS properties require external configuration. V2 rejects unsafe amount conversion; V3 normalizes and uniquely indexes emails; V4 adds budgets and notifications. | V1–V4 have not been verified against PostgreSQL in this review. The existing database was not migrated. Existing installations need schema comparison and manual baseline. The migration runbook omits V4. |

## D. Bugs and issue register

### Confirmed source/documentation issues

| ID | Severity | Module | Description / reproduction | Expected vs actual | Evidence | Status / owner |
|---|---|---|---|---|---|---|
| M-01 | Medium | Database docs | Follow `docs/DATABASE_MIGRATION_RUNBOOK.md` as written after V4 was added. | Expected runbook sequence and post-migration checks include every shipped migration; it documents only V1–V3, while `V4__user_budgets_and_persistent_notifications.sql` is present. | `docs/DATABASE_MIGRATION_RUNBOOK.md`; `backend/src/main/resources/db/migration/V4__user_budgets_and_persistent_notifications.sql` | **Deferred**; release engineering/database owner. |
| M-02 | Medium | Profile/account | Edit profile fields and save, then reload or sign in on another device. | Expected account profile change to persist; actual `FinancialContext.updateProfile()` writes local storage only and reports success. | `frontend/src/context/FinancialContext.jsx`; `frontend/src/pages/Profile.jsx`; `UserController` has only `/me` read API. | **Deferred**; frontend/backend account team. |

### Unverified risks and release blockers (not confirmed application defects)

| ID | Severity | Module | Risk / evidence | Status / owner |
|---|---|---|---|---|
| H-01 | High | PostgreSQL/Flyway release gate | V1–V4 migration and Hibernate `validate` have not completed on an isolated PostgreSQL instance. The latest isolated startup reached Flyway but failed with SQLSTATE 28P01 over the test host-port route; no migration success or schema validation was established. Earlier in-container authentication succeeded, so this does not prove a source-code credential defect. | **Open**; database/release engineering. Repeat only after the isolated connection route and test-role handoff are independently verified. |
| H-02 | High | Existing database deployment | The existing UPIQ database has not been migrated. A database created before Flyway history exists must be schema-compared with V1 and manually baselined at version 1; otherwise startup migration can attempt the fresh-install V1 schema. No existing database was inspected or changed in this audit. | **Open**; database operator. Requires verified backup, schema comparison, maintenance plan, and approved baseline before deployment. |
| M-03 | Medium | Notifications | Budget/spending notifications are generated during inbox retrieval; no scheduler or push/email delivery exists. | **Deferred**; backend/platform team. |
| M-04 | Medium | Chat history | Conversation is in-memory app state, not server-persisted; reload loses it. Logout and session expiry clear it as intended. | **Deferred**; frontend/backend AI team. |
| M-05 | Medium | Rate limiting | Rate limiter is process-local with a bounded map; eviction can reset an active client’s counter. Behind a reverse proxy, socket remote addresses can collapse to the proxy address; forwarded headers are intentionally not trusted. | **Deferred**; platform/security team. Use shared rate limiting and trusted-proxy configuration if deployment topology requires it. |
| M-06 | Medium | Google OIDC | Handoff tickets are held in an in-memory `ConcurrentHashMap`; restarts invalidate them and separate application instances do not share them. | **Deferred**; auth/platform team. Use a shared, short-lived store if running multiple replicas. |
| M-07 | Medium | Admin dashboard | Dashboard is aggregate/read-only; no user status, category/system configuration, or activity actions exist. | **Deferred**; admin product/backend team. Do not infer the controls from UI placeholders. |
| M-08 | Medium | Fraud review | Fraud flags are review heuristics. User resolution is not persisted and no transaction is blocked. | **Deferred**; product/risk team. |
| M-09 | Medium | Investment suggestions | Suggestions are fixed educational prompts derived from current-month cash flow; no investment suitability, objectives, or risk assessment is implemented. | **Deferred / deliberate limitation**; product team. |
| M-10 | Medium | Login enumeration | Unknown email uses a dummy BCrypt match and inactive users run BCrypt before the generic failure response. The response is generic, but database lookup and other path differences mean timing equivalence is not proven. | **Deferred risk**; security team. Avoid arbitrary delay; benchmark and redesign authentication lookup if threat model requires. |
| L-01 | Low | Voice assistant | Browser speech recognition/playback capabilities vary, permission is required, and the configured recognition locale is English (India). | **Deferred / platform limitation**; frontend team. |
| L-02 | Low | Feature verification | Responsive layout, screen-reader behavior, and real browser microphone flows were not exercised in this command-line test run. | **Open verification**; QA team. |

There were **no confirmed Critical bugs** and no confirmed High source-code defect that could be safely corrected without database/deployment changes. H-01/H-02 are release gates, not proven source bugs. Medium and Low items remain unchanged as requested.

## E. Database and migration status

| Version | Current purpose | Status in this review |
|---|---|---|
| V1 | Fresh-install initial users/categories/transactions schema; legacy transaction amount starts as `double precision`. | Source inspected; not applied to any database in this review. |
| V2 | Guarded conversion to `numeric(19,2)`; rejects null, non-finite, nonpositive, out-of-range, and over-precision rows before conversion. | Source inspected; PostgreSQL execution not verified. |
| V3 | Rejects trimmed case-insensitive email collisions, normalizes emails, and adds a case-insensitive unique index. | Source inspected; PostgreSQL execution not verified. |
| V4 | Adds user-owned budgets and persistent notifications, uniqueness rules and lookup indexes. | Source inspected; this migration is currently untracked in the worktree and PostgreSQL execution is not verified. |

`application.yml`, `application-local.yml`, `application-research.yml`, and `application-prod.yml` configure Hibernate `ddl-auto: validate`; Flyway owns schema changes. The production profile uses externally supplied datasource credentials, JWT secret, and explicit CORS origins. No Hibernate schema update or migration was run. Existing installations must be compared with V1 before manual baseline; automatic baseline-on-migrate is not configured. The existing database state and schema compatibility remain unverified.

## F. Testing report

### Backend

1. Initial command: `.\mvnw.cmd test` from `backend`. It stalled at `AdminBootstrapConfigurationTest` during dynamic Byte Buddy agent attachment with no assertion result; the test process was interrupted. This attempt is not counted as a pass/fail suite result.
2. Full suite with the already installed Byte Buddy agent preloaded:

   ```powershell
   $agent = Join-Path $env:USERPROFILE '.m2\repository\net\bytebuddy\byte-buddy-agent\1.14.17\byte-buddy-agent-1.14.17.jar'
   .\mvnw.cmd "-DargLine=-javaagent:$agent" test
   ```

   Result: **334 tests, 0 assertion failures, 5 errors, 3 skipped; BUILD FAILURE**. The five errors are all in `OllamaClientTest` and fail while creating its loopback `HttpServer` (`Unable to establish loopback connection`, `SocketException: Permission denied: connect`). No application assertion failure was reported. Skipped tests: `Checkpoint4ESmallBatchLiveTest`, `SystemBQ001RuntimeDiagnosticTest`, and `SystemCLiveOllamaVerificationTest`.

The Maven `test` phase completed main/test compilation before Surefire. A `package` goal was not run because a prior packaging issue and the existing target JAR require separate artifact-safe handling. No full backend pass is claimed.

### Frontend

- `npm test`: **193 passed, 0 failed, 0 skipped** (15 suites, Node test runner).
- `npm run build`: **passed** (Vite 8.3.0; 3,009 modules transformed).
- Dependencies were already installed; none were added.

### Database/runtime/integrity

- No PostgreSQL migration, Hibernate schema validation, authenticated live API test, Ollama runtime test, Docker operation, or browser end-to-end test was performed in this audit.
- `git diff --check` is run after this document is written; see the final response for its actual result.

## G. Remaining team tasks

### Priority 0 — Release/database safety

1. Establish a reliable connection route to a disposable PostgreSQL 16 test database using a dedicated test role; independently verify the role credential path without printing it.
2. Run fresh V1→V4 migrations on an empty disposable database, verify all migration history entries, and start the backend with production-equivalent `ddl-auto: validate`.
3. Test V2/V3 failure guards and V4 persistence/ownership using synthetic users and data. Do not use the existing UPIQ database.
4. For the existing database, take and validate an approved backup, compare schema with V1, run the safe precondition checks, and manually baseline only after database-operator approval. Then plan V2–V4 deployment and post-migration checks.
5. Update the migration runbook with V4 and the actual post-migration checks before production rollout.

### Priority 1 — Verification and operations

1. Run `OllamaClientTest` in a Windows/CI environment that permits loopback sockets; preserve the assertions and do not skip the tests.
2. Add true PostgreSQL integration tests for identity/sequence behavior, decimal round trips, migration failure atomicity, normalized email uniqueness, budgets, notifications, and two-user isolation.
3. Execute authenticated API and browser smoke tests for registration/login, imports, reports, insights, notifications, budgets, admin denial, and voice capability errors.
4. Confirm production CORS origins, JWT provisioning/rotation, database credentials, reverse proxy IP policy, Ollama endpoint/privacy, backup/restore, and admin bootstrap procedure with operators.

### Priority 2 — Product follow-up

1. Persist profile changes through an authenticated backend API.
2. Decide whether chat retention should survive reload and synchronize across devices; if so, design user-owned server-side history and retention/deletion policy.
3. Decide whether notification generation needs scheduling or delivery beyond inbox reads.
4. Add durable fraud-review resolution only after product/risk requirements are agreed.
5. Add multi-instance-safe Google handoff storage if replicas are planned.
6. Define supported speech browsers/locales and verify the chosen browser processing/privacy behavior.

## H. Known limitations

- INR-only transaction storage; no exchange rates or multi-currency ledger.
- Ollama is optional. Deterministic financial calculations remain available, but generated prose is qualitative and may be unavailable or rejected by response guards.
- Investment suggestions are educational and are not personalized financial advice or return forecasts.
- Fraud flags are explainable anomaly signals, not fraud determinations or transaction blocks.
- Notifications are in-app records; no email, push, or scheduled delivery.
- Voice depends on browser-native speech APIs and permissions.
- Report previews/history are device-local; chat is in-memory for the active app session.
- No live production database verification or full end-to-end test was performed.

## I. Release recommendations

Do not declare production readiness until V1–V4 are applied and Hibernate validation succeeds on an isolated PostgreSQL environment, existing-database baseline and backup procedures are reviewed, `OllamaClientTest` completes in a permitted loopback environment, and authenticated two-user tests confirm isolation for all new endpoints. Update the V4 runbook and verify the actual production environment configuration before release. Do not use a successful compile, unit test, Maven `BUILD SUCCESS`, or UI presence as a substitute for those checks.
