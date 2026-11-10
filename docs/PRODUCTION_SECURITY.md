# Production security configuration

## Authentication throttling

The backend applies fixed-window limits to `POST /api/auth/login` and `POST /api/auth/register`, keyed by the servlet connection's remote address. Defaults are 10 login attempts and 5 registration attempts per 60 seconds. Set `AUTH_LOGIN_RATE_LIMIT`, `AUTH_REGISTRATION_RATE_LIMIT`, and `AUTH_RATE_LIMIT_WINDOW_SECONDS` to tune them. Attempt limits are bounded to 1–100 and the window to 1–86,400 seconds. Invalid settings fail startup. The filter does not use `X-Forwarded-For` or other client-supplied identity headers. Its access-ordered map is capped at 10,000 identities; inserting a new identity at capacity evicts the least-recently used entry, which can reset an active client's counter.

This limiter is process-local. It is a useful single-instance safeguard, not shared protection across replicas; use a trusted gateway limiter or a shared limiter store before scaling horizontally. Confirm proxy behavior before using client IPs for enforcement.

## JWT key provisioning and rotation

Generate a production signing key using a cryptographically secure random generator, for example `openssl rand -base64 32`. Store the generated value directly in the deployment secret manager and inject it into the backend as `JWT_SECRET`. Never put it in frontend variables, source control, command history, logs, or support tickets. The application checks presence, byte length, the known development fallback, and HMAC key compatibility; those checks do not prove that a key is random.

The current JWT implementation uses one signing key and does not support overlapping keys or token revocation. Rotating the key therefore invalidates outstanding tokens. Plan rotation as a coordinated secret update and backend restart, communicate the expected reauthentication, and verify the new key without logging it. A future no-forced-logout rotation requires key identifiers and a bounded old-key verification window, plus a decision about how old tokens are retired.

## Registration enumeration limits

Registration is synchronous and returns HTTP 200 with the same response body for a new account, duplicate email, or duplicate username. The response says the request was processed and does not claim that an account was created. The server paths still differ in database work and password hashing time. Login returns the same error for an unknown email and a wrong password, but the unknown-email path skips BCrypt verification and can be faster; a disabled account also receives a distinct message in the API response. These differences can reveal account state through timing or response content. No arbitrary delay is added; robust mitigation requires generic login failure behavior and an email-verification/registration-pending flow, with delivery, retry, abuse, and account-recovery rules designed together.

## CORS

Local development defaults to `http://localhost:5173`. Production requires `UPIQ_CORS_ALLOWED_ORIGINS`, a comma-separated allowlist of explicit HTTP(S) origins with no path, query, fragment, user information, or wildcard. Startup validation rejects missing, blank, wildcard, and malformed origin configuration. Credentials remain disabled. Configure the actual deployment origin; do not use a guessed domain or wildcard.

## PDF amount parsing and fixtures

The previous arbitrary PDF amount ceiling of 1,000,000 has been removed because no business or domain constraint justified rejecting larger finite amounts. The existing currency-number syntax remains strict; malformed or non-finite amounts are still rejected and are not converted into transactions. Generated-PDF tests cover a valid amount below the old ceiling, the exact old boundary, a value above it, and a malformed amount. The fixtures exercise text extraction, preview, and malformed-row import rejection, but do not cover real bank templates, scanned-image OCR, multi-page layout variation, or every mixed-row/duplicate/persistence-failure combination.

## Database schema safety

Production still uses Hibernate automatic schema updates. Do not disable them until the existing deployed schema has been inventoried and a non-destructive versioned migration path has been verified. No migration or live database operation is part of this change.
