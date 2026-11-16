# UPIQ 2.0

UPIQ 2.0 is an INR-only personal-finance application for recording income and expenses, importing bank statements, reviewing budgets and trends, and asking bounded questions about a user's own ledger. Deterministic backend calculations provide financial amounts; the optional Ollama model generates explanatory language and does not calculate ledger totals. This repository is a development project, not a financial institution or investment-advice service.

## Current feature status

| Area | Current status |
|---|---|
| Email/password registration and login | Implemented; BCrypt, normalized email lookup, JWT, generic login failure. |
| Google Sign-In | Implemented as optional Google OIDC; requires deployment configuration and has not been verified against live provider credentials. |
| Transactions, categories, deterministic categorization | Implemented with authenticated user scoping. |
| CSV/PDF statement preview and import | Implemented for supported CSV layouts and digital text PDFs; OCR for scanned PDFs is not implemented. |
| Dashboard, reports, financial chat | Implemented with limitations described below; chat supports bounded intents and requires Ollama for generated responses. |
| Account budgets, notifications | Backend APIs and persistence are implemented; persistence/migration still needs PostgreSQL verification. Notification generation occurs on inbox access. |
| Financial insights, investment suggestions, fraud review | Implemented as deterministic user-ledger calculations/rules with constrained explanations or educational content; not personalized investment advice or proof of fraud. |
| Voice assistant | Browser-native speech input/playback; availability and privacy behavior vary by browser. |
| Admin dashboard | Admin-protected aggregate dashboard and account directory; administrative write actions and operational telemetry are limited or absent. |

The Flyway V1–V4 migrations are present in the repository, but **they have not been verified against PostgreSQL for the current worktree**. The existing application database has not been migrated. Do not treat test-suite or build results as database validation. See the [migration runbook](docs/DATABASE_MIGRATION_RUNBOOK.md) and [team handoff](docs/UPIQ_2.0_TEAM_HANDOFF.md).

## Technology and architecture

- **Frontend:** React 19, Vite 8, Tailwind CSS 4, Axios, Recharts. `frontend/src/App.jsx` uses `FinancialContext.currentView` and `activeTab` for active navigation; the separate React Router files are not the active navigation path.
- **Backend:** Java 21, Spring Boot 3.3.1, Spring Security, Spring Data JPA, Jakarta Validation, JJWT, PDFBox, and Apache Commons CSV.
- **Database:** PostgreSQL 16. Flyway applies versioned SQL migrations; every Spring profile configures Hibernate `ddl-auto: validate`.
- **AI:** `FinancialChatService` resolves supported requests and obtains deterministic, user-scoped financial facts. Ollama is optional for generated explanations. Insights/investment explanations are constrained to qualitative language; deterministic amounts are calculated by backend code.
- **Monetary model:** INR-only; transaction amounts use Java `BigDecimal`, PostgreSQL `NUMERIC(19,2)`, decimal-string JSON values, and frontend integer minor-unit arithmetic. No exchange conversion or multi-currency transaction storage is implemented.

### Repository structure

```text
backend/src/main/java/com/upiq/       Spring controllers, services, security, models, repositories
backend/src/main/resources/           Spring profiles, Flyway migrations, research fixtures
backend/src/test/java/                Backend unit and focused security/MVC tests
frontend/src/pages/                   Application screens
frontend/src/components/              Shared and feature-specific UI
frontend/src/context/                 Authentication, financial and budget state
frontend/src/services/                Backend API clients
frontend/src/utils/                   Money, import, session and feature helpers
frontend/test/                        Node built-in test suite
docs/                                 Security, migration, issue, roadmap and handoff documents
```

## Prerequisites

- Git.
- JDK 21.
- Node.js/npm compatible with the installed Vite version.
- Docker Desktop with Docker Compose for the root PostgreSQL/backend stack, or a separately provisioned PostgreSQL 16 database for native backend development.
- Ollama and an already available model only if using generated AI responses. The app does not download models.

## Local development

### Docker Compose backend and PostgreSQL

The root Compose file starts PostgreSQL and the backend; it does not start Vite. Compose reads the root `.env` for variable substitution. Create it from the example only when you do not already have one, then edit it locally with test/development settings:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Edit .env locally. Use private development values; never paste them into source control.
docker compose up --build
```

The backend listens on port 8080 and PostgreSQL is published on port 5432 by the current root Compose file. Compose persists PostgreSQL data in the `upiq-postgres-data` named volume. Do not remove or recreate an existing volume as part of routine setup.

### Frontend

In another PowerShell window:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Vite serves the frontend on its configured port (normally 5173). `VITE_API_BASE_URL` is browser-visible configuration, not a place for secrets. The root template provides a frontend API URL; for a native Vite process, set it in `frontend/.env.local` if an override is needed.

### Run the backend natively

Start PostgreSQL separately, then supply the datasource and JWT values to the backend process through its environment or IDE run configuration. Root `.env` is used by Compose; Maven does not automatically load it.

```powershell
$env:DB_URL = '<jdbc:postgresql URL for local PostgreSQL>'
$env:DB_USERNAME = '<local database role>'
$env:DB_PASSWORD = '<local database password>'
$env:JWT_SECRET = '<private local signing key of at least 32 UTF-8 bytes>'
Set-Location backend
.\mvnw.cmd spring-boot:run
```

For Google sign-in or a production profile, additional configuration is required. Follow [Authentication Setup](docs/AUTHENTICATION_SETUP.md) and [Production Security](docs/PRODUCTION_SECURITY.md). Do not copy production credentials into the frontend or repository.

## Environment variables

The root `.env.example` is a Compose template; `backend/.env.example` documents backend-process variables; `frontend/.env.example` contains only public Vite variables. These are variable names and purposes—not values to reuse as credentials.

| Variables | Purpose |
|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | PostgreSQL container initialization for a new local volume. Changing these after initialization does not rotate an existing database role password. |
| `DB_URL` or `DB_HOST`, `DB_PORT`, `DB_NAME`; `DB_USERNAME`, `DB_PASSWORD` | Backend datasource. Production must receive valid externally managed values. |
| `SERVER_PORT`, `SPRING_PROFILES_ACTIVE` | Backend listener and Spring profile. |
| `JWT_SECRET`, `JWT_EXPIRATION` | Backend JWT signing key and token lifetime. Keep the key private; production requires a suitable externally supplied secret. |
| `AUTH_LOGIN_RATE_LIMIT`, `AUTH_REGISTRATION_RATE_LIMIT`, `AUTH_RATE_LIMIT_WINDOW_SECONDS` | Bounded process-local authentication rate-limit settings. |
| `UPIQ_CORS_ALLOWED_ORIGINS` | Explicit comma-separated HTTP(S) origin allowlist; production rejects missing, malformed, or wildcard origins. |
| `UPIQ_GOOGLE_ENABLED`, `UPIQ_GOOGLE_CLIENT_ID`, `UPIQ_GOOGLE_CLIENT_SECRET`, `UPIQ_FRONTEND_ORIGIN`, `UPIQ_GOOGLE_REDIRECT_URI` | Optional Google OIDC setup. Server-side OAuth secrets must remain backend-only. |
| `UPIQ_ADMIN_BOOTSTRAP_ENABLED`, `UPIQ_ADMIN_EMAIL`, `UPIQ_ADMIN_PASSWORD` | Opt-in initial admin provisioning. Disabled by default; set the flag back to false and remove temporary credentials after provisioning. |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TEMPERATURE`, `OLLAMA_TIMEOUT` | Optional backend Ollama connection/generation settings. Use an address reachable from the backend runtime. |
| `VITE_PORT`, `VITE_API_BASE_URL` | Frontend development server/API URL; values are exposed to the browser bundle. |
| `RESEARCH_SEEDING_USER_PASSWORD` | Research-profile seed safeguard only; do not use a production credential. |

## Database and migrations

Flyway migrations run in order:

1. `V1__initial_schema.sql` creates the fresh-install users, categories, and transactions schema. The baseline transaction amount type is `double precision` because it represents the inspected legacy schema.
2. `V2__transaction_amount_numeric_19_2.sql` rejects invalid, nonpositive, over-precision, or out-of-range stored values and converts the amount column to `NUMERIC(19,2)`.
3. `V3__normalize_and_uniquely_index_user_emails.sql` rejects trimmed case-insensitive collisions, normalizes existing email strings, and adds a case-insensitive unique index.
4. `V4__user_budgets_and_persistent_notifications.sql` creates user-owned budgets and notifications, their ownership foreign keys, deduplication constraints, and lookup indexes.

Fresh empty databases are intended to run V1–V4 automatically before Hibernate validation. An existing pre-Flyway database must first be backed up and compared with V1, then manually baselined at version 1 only after operator review. Automatic baseline-on-migrate is not enabled. Do not run a migration against the existing application database until the schema, data preconditions, and recovery plan are verified. Repository presence is not proof that a migration ran successfully. Full instructions and current verification status are in the [database migration runbook](docs/DATABASE_MIGRATION_RUNBOOK.md).

Ownership of existing transaction/category rows is enforced by authenticated user-scoped queries and service checks; the legacy V1 schema does not add user foreign keys for those tables. V4 budgets and notifications have `user_id` foreign keys to users with cascade delete. Budget uniqueness is per user/category/month (including a separate total-budget uniqueness rule); notification event keys are unique per user.

## Authentication and authorization

- `POST /api/auth/register` always creates a normal `USER`; duplicate/success responses use a generic contract.
- `POST /api/auth/login` returns a JWT in `data.token` after BCrypt verification. Unknown email, disabled user, and wrong password share a generic failure response.
- Protected requests use `Authorization: Bearer <token>`. The backend verifies signature/expiration, reloads the user, and obtains current role/ownership from server-side state. Frontend token-shape checks are not authenticity checks.
- All non-public API requests require authentication. Controllers/services derive owner IDs from the authenticated principal; clients cannot supply another owner's identity for these operations.
- Google OIDC is optional and requires backend credentials and a matching callback. It requires verified email, does not automatically link an existing email account, and grants normal-user role only.
- `ROLE_ADMIN` protects `/api/admin/dashboard` and the admin account directory. Admin bootstrap is a one-time operator action; it is not automatically disabled in the environment after success.
- Production JWT/CORS/datasource startup requirements and residual security limits are detailed in [Production Security](docs/PRODUCTION_SECURITY.md).

## API overview

All JSON APIs use the `ApiResponse` envelope unless noted. Authentication is required except for auth/status and health routes.

| Path | Operations | Scope |
|---|---|---|
| `/api/auth/register`, `/api/auth/login` | `POST` | Public authentication. |
| `/api/auth/google/status`, `/api/auth/google/exchange` | `GET`, `POST` | Google availability and one-use handoff exchange. |
| `/api/v1/users/me` | `GET` | Authenticated user's profile. |
| `/api/v1/users`, `/api/v1/users/email/{email}`, `/api/v1/users/username/{username}` | `GET` | Admin-only account directory/lookups. |
| `/api/transactions` | `GET`, `POST`, `DELETE` | Authenticated user's ledger; `DELETE` removes that user's transactions. |
| `/api/transactions/{id}`, `/api/transactions/category/{category}` | `GET`; ID path also `PUT`/`DELETE` | Owner-scoped transaction operations. |
| `/api/categories` and `/api/categories/{id}` | `GET`, `POST`, `PUT`, `DELETE` | Owner-scoped categories. |
| `/api/pdf/upload`, `/api/pdf/import` | `POST` multipart field `file` | Authenticated statement preview and idempotent import; counts include imported, duplicate, rejected, failed. |
| `/api/financial/dashboard`, `/api/financial/report` | `GET` | User-scoped dashboard; report returns PDF bytes and accepts optional `month=YYYY-MM`. |
| `/api/budgets`, `/api/budgets/{id}` | `GET`, `POST`, `PUT`, `DELETE` | Authenticated user's monthly budgets. |
| `/api/notifications`, `/api/notifications/unread-count` | `GET` | User inbox/count; inbox access generates eligible alerts. |
| `/api/notifications/{id}/read`, `/api/notifications/{id}/dismiss` | `PATCH` | Owner-scoped persisted notification actions. |
| `/api/financial-insights`, `/api/investment-suggestions`, `/api/fraud-alerts` | `GET` | Authenticated user-scoped features. |
| `/api/financial-chat` | `POST` | Authenticated bounded financial question; user ID comes from principal. |
| `/api/admin/dashboard` | `GET` | `ROLE_ADMIN` aggregate metrics only. |
| `/health` | `GET` | Public application health endpoint. |
| `/api/pdf/health`, `/api/categories/health` | `GET` | Service health routes; these remain protected by the general authenticated API rule. |

## Financial, AI, notification, and voice behavior

- Financial totals, ratios, budgets, risk signals, and investment cash-flow summaries are calculated deterministically from the authenticated user's transactions. Transaction amounts remain INR-only.
- Financial Chat supports a bounded set of intents. Deterministic code calculates facts and passes a verified context to Ollama for response wording. Unsupported questions and Ollama failures have controlled responses. LLM text is not a substitute for a verified calculation.
- Financial Insights and Investment Suggestions retain deterministic amounts and use constrained qualitative explanation only. Investment content is educational, not guaranteed returns or personalized professional advice.
- Fraud Detection uses deterministic review rules (such as unusually large expenses, category spikes, and possible duplicates). A flag is not proof of fraud and does not block a payment.
- Notifications are persisted in PostgreSQL by V4 and created on inbox access; no scheduler, push, email, or preference system exists.
- Chat messages remain in frontend memory across navigation but do not survive all application/session lifecycle scenarios (including reload); logout/session expiry clear active history.
- Voice uses browser speech recognition and speech synthesis when available, requires microphone permission, and uses the existing authenticated Financial Chat path. Browser support and whether recognition is processed on-device vary; no external paid speech API or frontend credential is added.
- Profile changes currently update browser-local profile state; there is no backend profile update endpoint.
- OCR bill scanning and scanned-image extraction are not implemented. PDF extraction is text-based and parser fixtures do not cover every bank layout or multi-page variation.

## Testing and build commands

From PowerShell:

```powershell
Set-Location backend
.\mvnw.cmd test

Set-Location ..\frontend
npm test
npm run lint
npm run build
```

The latest recorded verification for the current worktree is:

- Backend command (Byte Buddy agent preloaded for this Windows environment):

  ```powershell
  $agent = Join-Path $env:USERPROFILE '.m2\repository\net\bytebuddy\byte-buddy-agent\1.14.17\byte-buddy-agent-1.14.17.jar'
  .\mvnw.cmd "-DargLine=-javaagent:$agent" test
  ```

  Result: 334 tests, 0 assertion failures, 5 errors, 3 skipped. All five errors are `OllamaClientTest` loopback-server setup errors caused by environment socket permission; this is **not a full passing backend suite**.
- Frontend: 193 tests passed; production build passed.
- PostgreSQL V1–V4 and Hibernate `ddl-auto: validate`: not verified against PostgreSQL.

See [Bugs and Issues](docs/BUGS_AND_ISSUES.md) and [Future Implementation](docs/FUTURE_IMPLEMENTATION.md) for the remaining issue register and roadmap. The [team handoff](docs/UPIQ_2.0_TEAM_HANDOFF.md) contains detailed status, evidence, and release gates.

## Documentation index

- [Authentication Setup](docs/AUTHENTICATION_SETUP.md)
- [Production Security](docs/PRODUCTION_SECURITY.md)
- [Database Migration Runbook](docs/DATABASE_MIGRATION_RUNBOOK.md)
- [Bugs and Issues](docs/BUGS_AND_ISSUES.md)
- [Future Implementation Roadmap](docs/FUTURE_IMPLEMENTATION.md)
- [Team Handoff](docs/UPIQ_2.0_TEAM_HANDOFF.md)
