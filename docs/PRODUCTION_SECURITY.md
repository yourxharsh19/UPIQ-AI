# Production security configuration

## Authentication throttling

The backend applies fixed-window limits to `POST /api/auth/login` and `POST /api/auth/register`, keyed by the servlet connection's remote address. Defaults are 10 login attempts and 5 registration attempts per 60 seconds. Set `AUTH_LOGIN_RATE_LIMIT`, `AUTH_REGISTRATION_RATE_LIMIT`, and `AUTH_RATE_LIMIT_WINDOW_SECONDS` to tune them. Attempt limits are bounded to 1–100 and the window to 1–86,400 seconds. Invalid settings fail startup. The filter does not use `X-Forwarded-For` or other client-supplied identity headers. Its access-ordered map is capped at 10,000 identities; inserting a new identity at capacity evicts the least-recently used entry, which can reset an active client's counter.

This limiter is process-local. It is a useful single-instance safeguard, not shared protection across replicas; use a trusted gateway limiter or a shared limiter store before scaling horizontally. Confirm proxy behavior before using client IPs for enforcement.

## JWT key provisioning and rotation

Generate a production signing key using a cryptographically secure random generator, for example `openssl rand -base64 32`. Store the generated value directly in the deployment secret manager and inject it into the backend as `JWT_SECRET`. Never put it in frontend variables, source control, command history, logs, or support tickets. The application checks presence, byte length, the known development fallback, and HMAC key compatibility; those checks do not prove that a key is random.

The current JWT implementation uses one signing key and does not support overlapping keys or token revocation. Rotating the key therefore invalidates outstanding tokens. Plan rotation as a coordinated secret update and backend restart, communicate the expected reauthentication, and verify the new key without logging it. A future no-forced-logout rotation requires key identifiers and a bounded old-key verification window, plus a decision about how old tokens are retired.

## Registration enumeration limits

Registration is synchronous and returns HTTP 200 with the same response body for a new account, duplicate email, or duplicate username. The response says the request was processed and does not claim that an account was created. The server paths still differ in database work and hashing time. Login returns the same generic failure for an unknown email, a wrong password, or a disabled account, and performs a BCrypt comparison on both the unknown-email and disabled-account paths. This reduces direct response disclosure and avoids skipping password-hash work, but it does not guarantee constant-time behavior because account lookup, database, and runtime timing can still differ. No arbitrary delay is added; stronger enumeration controls require a designed email-verification/pending-registration and recovery flow.

## On-demand financial feature scope

Authenticated `GET /api/notifications` generates a user-scoped monthly category-spending comparison when requested. Notifications are not persisted; dismissal is kept only in the active browser view. There is no preference, scheduler, durable read state, or push delivery. Authenticated `GET /api/financial-insights` returns deterministic monthly ledger aggregates and uses Ollama for a grounded explanation when available; the deterministic results remain available when Ollama is unavailable. `ROLE_ADMIN`-only `GET /api/admin/dashboard` returns account counts and platform-wide transaction aggregates. It does not expose individual transactions and is not fraud detection, audit logging, or operational telemetry. These features use existing tables and add no schema migrations.

Google sign-in is an optional OIDC web-client flow. Provider `sub` is persisted as a unique identity key; unverified identities are rejected, and an existing email account is never linked automatically. OAuth state and OIDC nonce validation use Spring Security's authorization-request and OIDC token validation. The callback sends a 90-second, single-use opaque exchange code to the originating frontend window; the UPIQ JWT is returned only by the authenticated-code exchange API, not in a redirect URL. The code store and OAuth authorization-request session are in-memory/local-session state, so multi-instance deployments require session affinity and are not covered by shared/distributed storage.

Admin bootstrap is opt-in and disabled by default. It requires an explicit email/password, obtains a PostgreSQL transaction advisory lock, creates an administrator only when none exists, and refuses an email collision with a normal account. It never modifies existing admin credentials. Disable bootstrap after the first administrator is created. Password material is BCrypt encoded and is never logged.

## CORS

Local development defaults to `http://localhost:5173`. Production requires `UPIQ_CORS_ALLOWED_ORIGINS`, a comma-separated allowlist of explicit HTTP(S) origins with no path, query, fragment, user information, or wildcard. Startup validation rejects missing, blank, wildcard, and malformed origin configuration. Credentials remain disabled. Configure the actual deployment origin; do not use a guessed domain or wildcard.

## PDF amount parsing and fixtures

The previous arbitrary PDF amount ceiling of 1,000,000 has been removed because no business or domain constraint justified rejecting larger finite amounts. The existing currency-number syntax remains strict; malformed or non-finite amounts are still rejected and are not converted into transactions. Generated-PDF tests cover a valid amount below the old ceiling, the exact old boundary, a value above it, and a malformed amount. The fixtures exercise text extraction, preview, and malformed-row import rejection, but do not cover real bank templates, scanned-image OCR, multi-page layout variation, or every mixed-row/duplicate/persistence-failure combination.

## Database schema safety

Flyway V1 represents the inspected legacy schema, V2 validates and converts transaction amounts to `NUMERIC(19,2)`, and V3 normalizes email values and creates a trimmed case-insensitive unique index. All profiles use Hibernate `ddl-auto: validate`; Flyway owns schema changes. Fresh databases migrate from empty. Existing databases must be schema-compared with V1 and explicitly baselined at version 1 before V2/V3 run. Automatic baseline is disabled. Follow [the database migration runbook](DATABASE_MIGRATION_RUNBOOK.md); no migration was applied to the existing database during this work.

Transactions are INR-only in this release. Java transaction amounts use `BigDecimal`; API monetary amounts are decimal strings. Amounts must be positive, within `NUMERIC(19,2)`, and have at most two fractional digits. Existing rows are not deduplicated. The amount migration aborts if its range/scale/data checks fail. A verified backup and independent before/after aggregate checks are required before migrating any existing installation.
