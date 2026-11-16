# Authentication Setup

## Optional Google OpenID Connect

Create a **Web application** OAuth client in Google Cloud Console. Add the exact backend callback URI to **Authorized redirect URIs**:

- Local backend: `http://localhost:8080/login/oauth2/code/google`
- Production: `https://<your-backend-host>/login/oauth2/code/google`

Set the app's frontend origin and redirect URI to the matching deployed values. In Google Cloud, configure the OAuth consent screen and add the accounts that may sign in as test users while the consent screen is in testing mode.

Provide these environment variables to the backend (or root Compose `.env`):

- `UPIQ_GOOGLE_ENABLED=true`
- `UPIQ_GOOGLE_CLIENT_ID=<Google OAuth client ID>`
- `UPIQ_GOOGLE_CLIENT_SECRET=<Google OAuth client secret>`
- `UPIQ_FRONTEND_ORIGIN=http://localhost:5173` (use your exact production HTTPS origin in production)
- `UPIQ_GOOGLE_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google` (use the registered production HTTPS callback in production)

With the feature disabled (`UPIQ_GOOGLE_ENABLED=false`, the default), missing Google credentials do not affect email/password login or registration and the frontend reports Google sign-in as unavailable. When enabled, missing credentials, invalid origins, or non-HTTPS production origins fail configuration. Spring Security validates OAuth state and the OIDC nonce; the app requires Google's verified-email claim and stable subject. It does not auto-link an existing email account. A user with a matching existing account must continue using that account unless a future explicit linking flow is added. Google sign-in never assigns `ROLE_ADMIN`.

The OAuth callback opens in a popup and posts a short-lived, single-use opaque code to the exact configured frontend origin. The frontend exchanges the code for the existing UPIQ JWT over the API; the JWT is not placed in a redirect URL. The handoff store is local to one backend process and OAuth authorization state uses the servlet session. Multi-instance deployment therefore needs session affinity; distributed handoff/state storage is not implemented.

## Provision the first administrator

Bootstrap is disabled by default. It creates one account only if no `ROLE_ADMIN` exists. If the requested email belongs to an existing normal account, startup fails safely; it does not promote that account. If an admin already exists, credentials are never overwritten. The runner does not automatically clear the enable flag or credentials; the operator must disable bootstrap and remove temporary values after provisioning. Use a unique account email or provision role changes through a separately reviewed operational process.

Set these variables in the backend environment:

- `UPIQ_ADMIN_BOOTSTRAP_ENABLED=true`
- `UPIQ_ADMIN_EMAIL=<dedicated administrator email>`
- `UPIQ_ADMIN_PASSWORD=<unique password of 12 to 72 UTF-8 bytes>`

For a local Docker Compose run, use PowerShell placeholders and do not paste the password into a command line that will be saved in shell history:

```powershell
$env:UPIQ_ADMIN_BOOTSTRAP_ENABLED = 'true'
$env:UPIQ_ADMIN_EMAIL = '<dedicated-admin@example.com>'
$secureAdminPassword = Read-Host 'Enter a unique bootstrap password' -AsSecureString
$env:UPIQ_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $secureAdminPassword).Password
docker compose up --build -d
```

The password is read without echo. Do not print the variable or commit it. After startup succeeds, disable bootstrap and remove the temporary password from the environment before subsequent starts:

```powershell
$env:UPIQ_ADMIN_BOOTSTRAP_ENABLED = 'false'
Remove-Item Env:UPIQ_ADMIN_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:UPIQ_ADMIN_EMAIL -ErrorAction SilentlyContinue
docker compose up -d
```

If using Compose `.env` instead, put the values in the root `.env` only, restrict its filesystem access, then set the flag back to `false` and remove the password after provisioning. For a natively running backend, set the same variables in the process environment before `cd backend; .\mvnw.cmd spring-boot:run`.

To verify provisioning without printing a token, sign in through the ordinary email/password endpoint or UI, then request `GET /api/v1/users/me` and confirm its returned role is `ADMIN`; request `GET /api/admin/dashboard` and confirm HTTP 200. A normal user should receive HTTP 403 for that endpoint, while a request without a token should receive HTTP 401. The frontend hides admin navigation for normal profiles, but backend authorization is authoritative.

Public registration always assigns `ROLE_USER`, even if a client includes a role property. Profile/account APIs do not provide a role update operation. Store bootstrap credentials in an approved secret manager for production; do not place them in source control or frontend configuration.
