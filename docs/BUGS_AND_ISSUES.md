# UPIQ 2.0 — Bugs and Issues

Audit date: 2026-10-13  
Repository: `C:\Users\Harsh\Github_Repos\UPIQ-2.0` · branch `main`

This register reflects source review and the fresh checks listed below. A code-path finding is marked **Confirmed**; a plausible issue that depends on deployment or real account behavior is **Potential**; prior incidents remembered from the project work are **User-reported**. “Fixed in worktree” does not mean that the current edits are deployed.

## Confirmed findings fixed in this audit

| Priority | Finding and impact | Fix and evidence |
|---|---|---|
| High | Generic backend exceptions returned `ex.getMessage()` to API clients, which could disclose database or implementation details. Exception and parse logs could also include raw input. | `GlobalExceptionHandler` now returns a fixed generic 500 message and logs exception classes rather than exception text/stack traces. Added `GlobalExceptionHandlerTest`. |
| High | PDF/CSV parsing and calculation debug logs included statement filenames, transaction amounts/descriptions/dates, user IDs, and calculated totals. Anyone with log access could see financial data unrelated to their own account. | Parser, mapping, calculation, and transaction logs retain event-level messages without statement payloads or per-user amounts/identifiers. Added a CSV log regression test using synthetic markers. Review log sites before adding diagnostic fields. |
| Medium | `BudgetProvider` parsed `upiq_budgets` without handling invalid JSON or unavailable browser storage. A malformed or blocked localStorage value could throw while the app initializes or saves. | Added `budgetStorage.js` with guarded reads/writes and safe empty-object fallback. Added tests for valid, malformed, wrong-shaped, and inaccessible storage. Budgets remain usable in memory when persistence is blocked. |
| Medium | `CreateTransactionRequest` accepted zero/negative amounts, and its case-insensitive type validation allowed values such as `EXPENSE` that could be persisted with noncanonical casing and omitted by case-sensitive consumers. Create also silently replaced an invalid supplied date with the current time; update failures surfaced inconsistently. | Added positive-amount validation; normalize accepted transaction types to lowercase; accept ISO date-only values as start-of-day; reject malformed supplied dates instead of silently changing them. Added DTO/service regression tests. |
| Medium | Frontend `.env.example` contained server-side DB/JWT/Ollama/OAuth-secret settings. Vite frontend environment files are not a place for server credentials and can encourage operators to put them in browser-facing configuration. | Reduced `frontend/.env.example` to `VITE_PORT` and `VITE_API_BASE_URL`, with a note to configure server-only settings outside the frontend. No actual secret was found in this template. |

## Confirmed fixes already present in the inspected worktree

These changes predate this audit turn and were preserved. Fresh tests passed, but they are not edits made by this audit.

| Finding | Current evidence/status |
|---|---|
| Public registration could accept a caller-selected `ADMIN` role. | `AuthService.registerUser` always assigns `USER`; `AuthServiceRegistrationTest` covers role escalation input. **Fixed in worktree.** |
| Authenticated user-directory endpoints exposed all users or arbitrary email/username lookups without an admin check. | `UserController` requires `ROLE_ADMIN` for directory/list/lookups; `/me` remains the self endpoint. `UserControllerAuthorizationTest` covers user/admin access. **Fixed in worktree.** |
| Cross-user transaction read/update/delete failures were generic runtime exceptions and therefore mapped to 500 rather than forbidden. | `TransactionServiceImpl` throws `AccessDeniedException`; the common handler maps this to 403. Ownership regression tests cover read/update/delete. **Fixed in worktree.** |
| Assistant fallback text could imply invented account facts when the API failed. | The active `App.jsx` view loads `AIAssistant.jsx`; it uses `requestFinancialChatAnswer` and presents an error/retry instead of fixed financial claims. `FinancialAssistant.jsx` also presents API errors, but is routed only through the separate `src/routes` tree. **Fixed in worktree.** |
| Insights presented client calculations as AI/fraud capabilities; Budget and Prediction navigation was actionable although these advanced services did not exist. | Active UI identifies browser-local budgets and estimates, marks cloud sync/advanced AI predictions Coming Soon, and describes fraud monitoring as upcoming. Basic budget/category/transaction paths remain available. **Fixed in worktree.** |
| Report preview had unsupported fraud/signature claims and could assume a report existed. | Current `Reports.jsx` computes monthly summaries from loaded transactions, provides empty states, gates month selection/downloads, and does not claim cryptographic signing or fraud blocking. `GET /api/financial/report?month=YYYY-MM` supports the selected month. **Fixed in worktree.** |
| Category/registration pages were not reachable in active app navigation and category screens lacked their budget provider. | `App.jsx` maps Categories and Register and mounts `BudgetProvider`; **fixed in worktree**. |

## Remaining confirmed limitations

- **Currency provenance — Medium:** `Transaction` stores a `Double` amount but no currency code. The backend calculation/report layer cannot verify or convert currencies; the PDF currently labels amounts INR. Do not treat a display-currency selector as conversion or source-currency metadata. Relevant files: `backend/src/main/java/com/upiq/transaction/model/Transaction.java`, `FinancialReportService.java`, `frontend/src/context/FinancialContext.jsx`.
- **Production schema management — Medium:** `application-prod.yml` still uses Hibernate `ddl-auto: update`; no versioned migration workflow is configured. Adding a migration plan and validating the deployed schema should precede a production migration to validation-only mode. No setting was changed here because deployment schema state is not available.
- **Bounded Financial Chat — Medium:** supported questions are selected by phrase-based intent resolution; supported grounded answers depend on configured Ollama. Unsupported intents, absent transaction data, and generation errors are distinct handled results. This is not a general financial-advice engine.
- **Local-only budgets — Low:** budget values use browser localStorage. They are not stored in PostgreSQL, synchronized across devices, or included in the authenticated server report calculations.
- **Statement parsing — Medium:** backend PDF/CSV parsing is heuristic text extraction; the browser upload UI currently accepts PDF only. Scanned-image OCR is not implemented. Parsed rows require user review before importing.
- **Financial report currency — Medium:** PDF output labels amounts INR even though the ledger has no currency metadata. Confirm that every account is INR-only before relying on this label; otherwise remove the label or add stored currency semantics.
- **Legacy research evaluation — Low:** the A/B/C runner records raw answers, errors, latency, and optional token/timing metadata but does not score correctness, grounding, or statistical significance. Several benchmark calculation types are intentionally rejected as unsupported.

## Potential issues requiring deployment or authenticated checks

| Priority | Risk | Next check |
|---|---|---|
| High | `application.yml` contains a known local-development JWT fallback; the production profile does not explicitly require a supplied secret. Root Compose interpolates `JWT_SECRET`, but direct production launches must not omit it. | Verify production startup environment injection without printing values. Fail closed on a missing/weak production signing key before public deployment. |
| Medium | `SecurityConfig` allows `*` origins (credentials are disabled). This may be broader than the intended production browser-origin policy. | Confirm real deployment origins, then replace wildcard with an explicit allowlist if appropriate. |
| Medium | Browser interaction and authenticated transaction creation were not performed in this audit because no authenticated session was available. | In a signed-in account, create an owner-authorized transaction and verify it appears after save; submit an invalid amount/date and confirm a validation error without a false success. Do not use fabricated financial data. |
| Low | Voice output uses browser SpeechSynthesis; voice input was removed from the current worktree. Compatibility and accessibility across target browsers were not tested. | Exercise supported browsers only if voice features are reintroduced. |

## User-reported incidents retained from project history

- **Financial Chat latency/outage — User-reported, historically confirmed by runtime logs:** requests against local `llama3.1:8b` reached approximately 60-second backend timeouts and exhausted two attempts; a separate manual retry later succeeded. Earlier controlled measurements found uncapped answer generation around 35–57 seconds and fixed limits of 160/256 tokens could truncate answers. The prompt-only concise-answer change avoids arbitrary output caps. Do not claim the current runtime latency is eliminated without a fresh real chat request.
- **Stale container image / deployment mismatch — User-reported, resolved operationally at the time:** the backend previously ran an older Docker image than local source. The root `docker-compose.yml` and Compose project `upiq-20` were used for the subsequent backend deployment. This audit did not rebuild/restart services; current source edits in this audit are not included in that prior image.
- **Live transaction save and dashboard refresh — User-reported/unverified:** earlier smoke verification lacked an authenticated browser session. Source/tests cover persistence and response-driven refresh, but no real-account transaction was created in that check.

## API and persistence reference

- Auth: `POST /api/auth/register` and `/api/auth/login` are public. Registration creates a normal user. Login returns an `ApiResponse` with `data.token`.
- Transactions: authenticated `POST/GET /api/transactions`, `GET /category/{category}`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, and user-scoped bulk `DELETE /api/transactions`. The principal, not request JSON, supplies the owner ID. Create returns 201 with the saved `TransactionResponse`.
- Categories: authenticated `POST/GET /api/categories`, `GET /type/{type}`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`; service lookups are owner-scoped.
- Statement parsing: authenticated `POST /api/pdf/upload` returns parse candidates without persisting. Authenticated `POST /api/pdf/import` imports idempotently using file fingerprint plus source row. Frontend supports PDF selection; backend parsers accept PDF and CSV.
- Dashboard/report: authenticated `GET /api/financial/dashboard` returns per-user latest-month summary; `GET /api/financial/report?month=YYYY-MM` returns PDF bytes. Financial Chat is authenticated `POST /api/financial-chat` with `{ "question": "..." }` and no user ID input.
- Users: authenticated `GET /api/v1/users`, `/email/{email}`, and `/username/{username}` require admin; `/me` is self lookup.
- `GET /health/health` is public. Other API routes require JWT. JSON responses generally use `{ success, data, message }`; bean validation returns 400; access denial returns 403; unexpected errors return a generic 500 wrapper.
- Research runner is an opt-in application runner, not a REST endpoint. There are no REST budget persistence, fraud-detection, investment, push-notification, or experiment-metric endpoints.

### Request/response and calculation details

- Registration accepts email, password, and optional username; an optional caller-supplied role is ignored. Login accepts email/password and returns the token in `data.token`. `UserDTO` contains ID, email, username, full name, role, active state, created time, and last-login time; it omits password hashes.
- Transaction create/update use `{ amount, type, category, description, paymentMethod, date }`. Amount must be positive; type is income/expense (case-insensitive input, canonical lowercase persistence). `TransactionResponse` contains `id`, `userId`, amount, type, category, description, date, and payment method.
- Category create/update use `{ name, type, description, color, icon }`; response fields are ID, name, type, description, color, and icon. Categories and transaction queries use the authenticated principal's scope.
- PDF/CSV parse responses include total/success/failure counts, candidate transactions, errors, and message; candidates are not persisted by `/upload`. `/import` returns imported, duplicate, rejected, and failed counts.
- Dashboard response includes transaction-data presence, latest/previous available month, current-month income/expense/net/savings/count summary, monthly expense comparison, and category spending totals/counts/percentages. Empty accounts receive an explicit no-data response.
- Financial Chat accepts a nonblank question only; the controller supplies user scope. The response has answer, optional calculation type/context/model/latency, and supported/error flags. The intent resolver is bounded; unsupported questions are not approximated with arbitrary calculations.
- Financial calculations use inclusive date ranges. Income/expense totals sum positive transaction amounts; net is income minus expense; savings rate is zero when income is zero. Category percentage is zero when total expense is zero. Period percentage change is unavailable for a zero baseline. Research-only unsupported formulas are rejected rather than approximated.
- Bean validation errors use HTTP 400 with timestamp/status/error/message/field errors/path. Generic JSON operations use the common response wrapper; PDF report returns raw PDF bytes; single-transaction delete returns HTTP 204.

### Configuration and repository hygiene facts

Root `.env.example` supplies local Compose templates; `backend/.env.example` is for local backend setup; `frontend/.env.example` contains only Vite-public variables. Do not commit `.env`, signing keys, DB credentials, OAuth secrets, model files, or private/generated research results. Root Compose runs PostgreSQL/backend; frontend Vite is separate. The checked-in research JSONs and opt-in test fixtures are active inputs, not cleanup candidates. `research-results/` is ignored runtime output and its local artifacts were retained.

## Research observations preserved

The checked-in benchmark contains synthetic fixture data. The selected Q001/Q006/Q011 cases historically calculated Food expense 3,620.00 across 8 transactions (27.50%), July/August expense totals 11,356.00/13,166.00 (difference 1,810.00; 15.94%), and a largest expense of 2,100.00. These are fixture facts, not user financial data or model-quality results.

A prior recorded small-batch run observed System B content-type extraction failures near timeout; System C used an unsupported currency symbol on two cases and made an unsupported “only transaction” claim on another. System C grounding instructions were subsequently hardened. A separate diagnostic recorded a CPU-only prompt evaluation around 3,665 tokens and roughly 69,873,728 ms server-side duration before HTTP 200, after the Java client had already failed. These isolated historical observations have no established root cause and must not be treated as comparative model-quality findings. The opt-in test `Checkpoint4ESmallBatchLiveTest` uses 180 seconds per generation and a `CREATE_NEW` result writer; use a unique output path and a hard external process timeout for future live runs.

## Verification performed for this audit

- Frontend tests: `node --test` — **77 passed, 0 failed**.
- Frontend production bundle: `node .\node_modules\vite\bin\vite.js build` — **passed**. `npm run build` could not launch because the machine's npm shim points to a missing npm installation; the local Vite executable was used directly.
- Backend: `docker run --rm -v "<repo>\backend:/workspace" -w /workspace maven:3.9.7-eclipse-temurin-21 mvn test` — **213 tests, 0 failures, 0 errors, 3 skipped**. The short-lived Maven runner did not connect to the application database or Compose services.
- `git diff --check` is run after final documentation consolidation.
- No authenticated browser/E2E session or live Ollama generation was used.
