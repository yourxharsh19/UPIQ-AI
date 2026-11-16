# Production security and data-handling notes

This document describes the current repository implementation. It is not a penetration-test report or proof that a deployment is secure. Configure and verify the actual production environment before release.

## Authentication, sessions, and account enumeration

- Email/password registration is synchronous and returns HTTP 200 with the same generic response for a new account, duplicate email, and duplicate username. Public registration always assigns `ROLE_USER`.
- Login returns the same generic failure response for unknown email, wrong password, and disabled account. The unknown-email and disabled-account paths perform BCrypt work, but database lookups and runtime behavior can still differ; constant-time behavior is not guaranteed. No arbitrary sleep is used.
- Passwords are BCrypt-encoded. Backend request validation and BCrypt's 72-byte input behavior must remain compatible; do not truncate passwords silently.
- JWT protected requests validate signature and expiration, reload the account, and derive the current role and user ID from server-side data. Frontend token-shape/expiration checks are not token authenticity checks. Production requires an externally provisioned `JWT_SECRET`; the application checks presence, UTF-8 byte length, the known local fallback, and HMAC key compatibility, but cannot prove entropy.
- Logout/session expiry clears frontend authentication state and active chat state. Chat content is not server-persisted and does not survive a full browser/application lifecycle.

## Rate limiting

`AuthRateLimitFilter` applies fixed-window limits to exact `POST /api/auth/login` and `POST /api/auth/register` paths, keyed by the servlet connection remote address. Defaults are 10 login attempts and 5 registration attempts per 60 seconds. Environment mappings are `AUTH_LOGIN_RATE_LIMIT`, `AUTH_REGISTRATION_RATE_LIMIT`, and `AUTH_RATE_LIMIT_WINDOW_SECONDS`. Limits are bounded (attempts 1–100; window 1–86,400 seconds); invalid configuration fails startup.

The filter does not trust `X-Forwarded-For` or other client-supplied identity headers. Its access-ordered map is capped at 10,000 entries; eviction can reset an active client's counter. The limiter is process-local and not shared across replicas. Review the trusted proxy topology and use a gateway/shared limiter before horizontal scaling.

## Authorization and user-data ownership

All API requests except explicitly public authentication/health/OIDC routes require authentication. Services use the authenticated principal's user ID for transaction, category, budget, notification, chat, insight, investment, and fraud queries. Transaction update/delete and notification/budget mutations enforce ownership. Client-supplied IDs do not establish ownership.

`ROLE_ADMIN` is required for `/api/admin/dashboard` and the account directory/lookups under `/api/v1/users`; ordinary users receive 403 through the security chain. The dashboard returns aggregate counts/totals rather than transaction records. The account directory contains user profile identifiers and contact fields and is admin-only. There is no admin user-status mutation API or broad system-configuration interface.

V1 legacy transaction/category tables carry user IDs but do not define user foreign keys; their ownership boundary is enforced by application queries/checks. V4 budgets and notifications add `user_id` foreign keys to `users` with cascade delete, plus user-scoped uniqueness/indexes. PostgreSQL enforcement of V4 is not yet verified for this worktree.

## Google OpenID Connect

Google OIDC is optional and disabled by default. When enabled, the backend requires configured client credentials and a registered callback, validates the provider's authorization state/OIDC identity, requires verified email and subject, refuses implicit linking to an existing email account, and creates only a normal user. The callback sends a short-lived single-use handoff code to the configured frontend origin; it does not place the UPIQ JWT in a redirect URL.

OAuth authorization state and handoff tickets are local/in-memory or servlet-session state. Multi-instance deployment needs session affinity; a shared/distributed handoff store is not implemented. Live Google provider sign-in has not been verified in the current test report.

## CORS and production configuration

Local development defaults to the explicit frontend origin `http://localhost:5173`. Production requires `UPIQ_CORS_ALLOWED_ORIGINS` containing explicit HTTP(S) origins. Startup validation rejects missing/blank values, wildcard values, and origins containing a path/query/fragment/user information. Credentials remain disabled. Set the actual deployed frontend origin; do not use a guessed hostname or wildcard.

The `prod` profile requires datasource URL, username, password, and JWT configuration through backend environment/configuration. Production secrets must be supplied by the deployment's protected secret mechanism and never placed in `VITE_*`, source control, logs, or support tickets. Root/backend `.env.example` files are templates only. The frontend `.env.example` is limited to public Vite variables.

## Admin bootstrap

Initial administrator bootstrap is opt-in and disabled when the enable property is absent/false. When explicitly enabled, an application runner validates the configured admin email and 12–72 UTF-8-byte password, takes a PostgreSQL transaction advisory lock, creates an active `ADMIN` only if no administrator exists, and BCrypt-encodes the password. It fails rather than promoting an existing normal account or overwriting an existing admin. The code does **not** mutate the environment flag after provisioning; the operator must set `UPIQ_ADMIN_BOOTSTRAP_ENABLED=false` and remove temporary bootstrap credentials before later starts.

## Financial calculations and AI

Transaction amounts are INR-only. Backend storage/calculation uses `BigDecimal`; PostgreSQL V2 targets `NUMERIC(19,2)`; monetary API fields are serialized as decimal strings; frontend totals use integer minor units. The transaction currency is not stored per record and no exchange conversion is performed.

Core financial totals, budget usage, comparisons, investment cash-flow figures, and fraud review signals are deterministic calculations/rules over the authenticated user's own ledger. Financial Chat uses a bounded intent resolver and passes verified calculated context to Ollama for answer wording; unsupported questions and model failures have controlled paths. Financial Insights and Investment Suggestions use constrained qualitative explanations. Model output is not an authoritative calculation. Ollama availability, response quality, latency, and deployment data-handling policy require separate verification.

Investment suggestions are educational information, not personalized professional advice or guaranteed returns. Fraud alerts are deterministic anomaly signals, not a trained prediction model, proof of fraud, or a payment block. They should be reviewed by the user and do not replace bank dispute processes.

## Notifications and voice

Notifications are persisted by the V4 `notifications` table and are scoped to the owner. Budget thresholds and month-over-month category spending notifications are generated when the authenticated user accesses the inbox. Read/dismiss operations are persisted. No scheduler, push/email delivery, quiet hours, or user preference API is implemented. V4 persistence has not been verified against PostgreSQL for the current worktree.

Voice input uses browser-native speech-recognition APIs when available and sends recognized text through authenticated Financial Chat. Speech playback uses browser speech synthesis. Microphone permission is required; support and processing location vary by browser, and recognition may involve the browser's speech service. The application does not bundle a paid speech API key. Do not represent voice as available or on-device in every browser.

## Statement parsing and OCR

CSV and digital text-PDF parsing use heuristics and preserve row validation/rejection metadata. The removed 1,000,000 PDF amount ceiling had no established business constraint; strict numeric parsing and invalid-amount rejection remain. Generated-PDF fixtures cover basic text extraction, old-boundary/large amounts, missing dates, and malformed amounts. They do not establish compatibility with every bank layout, scanned-image OCR, all multi-page documents, or all persistence-failure cases. No OCR bill scanning is implemented.

## Database schema safety and release state

Flyway files present in the repository:

1. V1 creates the fresh-install legacy schema with `transactions.amount` as `double precision`.
2. V2 validates existing amount data and converts it to `NUMERIC(19,2)`.
3. V3 rejects normalized email collisions, normalizes values, and adds a trimmed case-insensitive unique index.
4. V4 adds budgets and persistent notifications, user foreign keys, constraints, and indexes.

All profiles use Hibernate `ddl-auto: validate`; Flyway owns schema changes. Fresh PostgreSQL setup is intended to run V1–V4. Existing databases require a backup, schema comparison with V1, an explicit manual Flyway baseline at version 1, and then later migrations; automatic baseline-on-migrate is not configured. The current worktree has **not** completed V1–V4 verification against PostgreSQL or Hibernate schema validation. The existing application database has not been migrated. Follow the [migration runbook](DATABASE_MIGRATION_RUNBOOK.md) and [team handoff](UPIQ_2.0_TEAM_HANDOFF.md); do not use the existing database as a test target.

The latest recorded backend test result is 334 tests, 0 assertion failures, 5 `OllamaClientTest` loopback setup errors due to environment socket permission, and 3 skipped tests. This is not a full passing backend suite. The latest frontend result is 193 tests passed and production build passed. See [Bugs and Issues](BUGS_AND_ISSUES.md) for the verification evidence and remaining release gates.
