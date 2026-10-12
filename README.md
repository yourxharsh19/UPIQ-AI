# UPIQ AI 2.0

UPIQ AI is a personal-finance college project. It provides transaction tracking, deterministic financial summaries, statement parsing, local category budgets, and a bounded financial assistant. A separate research package supports a question-only/raw-context/verified-context LLM experiment. The maintained project records are [Bugs and Issues](docs/BUGS_AND_ISSUES.md) and [Future Implementation](docs/FUTURE_IMPLEMENTATION.md).

## Architecture and stack

- **Frontend:** React 19, Vite 8, Axios, Tailwind CSS 4, Recharts. The active app uses `FinancialContext.currentView` and `activeTab` for navigation; page components are lazy-loaded behind Suspense and an error boundary. Although React Router is a dependency and `src/routes` exists, it is not the active navigation path.
- **Backend:** Java 21, Spring Boot 3.3, Spring Security, stateless JWT authentication, Spring Data JPA, PostgreSQL. PDFBox and Commons CSV support statement parsing; PDFBox also creates report PDFs.
- **Database:** PostgreSQL 16 in Docker Compose. Hibernate is configured with `ddl-auto: update`; use a disposable/local database for development and migrations before production.
- **Assistant:** recognized question intents are resolved and financial results are calculated deterministically. System C grounds its response in verified context and uses Ollama when configured. Ollama is needed for supported AI chat responses, not for the basic application.
- **Research:** separate backend A/B/C prompt adapters, shared Ollama generation boundary, benchmark resources, and opt-in raw-result runner. There are no answer-quality metrics or statistical conclusions.

## Frontend pages and workflows

The active view switch exposes Home, Login, Register, Dashboard, Transactions, Categories, AI Assistant, Insights, Reports, Profile, and an Admin view gated in the UI by profile role. Server-side authorization remains authoritative. Advanced predictions/cloud budget sync are labeled Coming Soon; the estimate and budgets currently run in the browser.

Transactions can be created, viewed, filtered, edited, and deleted through frontend services. Statement upload currently accepts PDF, previews parsed rows, and lets the user save them. The backend parser also accepts CSV, but there is no CSV upload flow in the current UI. The dashboard combines backend financial summary data with client-side widgets. Reports can request an authenticated PDF; the report preview/archive currently uses frontend state and is not a backend report-history workflow.

## Authentication, sessions, and API integration

The backend exposes `POST /api/auth/register` and `POST /api/auth/login`; a successful login returns an `ApiResponse` with `data.token`. The frontend validates saved JWT structure before restoring a backend session, stores the bearer token, and attaches it to protected Axios requests. Client-side token structure validation is not token authenticity validation; the backend validates protected requests. A protected 401 clears auth/session storage, resets in-memory user state, and returns the app to Login without reloading. Demo login is an explicit local demo path and is separate from backend authentication. Google login is unavailable.

The frontend API base defaults to `http://localhost:8080/api` (`VITE_API_BASE_URL`). Implemented API paths include `/api/transactions`, `/api/categories`, `/api/pdf/upload`, `/api/pdf/import`, `/api/financial/dashboard`, `/api/financial/report`, `/api/financial-chat`, `/api/auth`, `/api/v1/users`, and health routes. Protected routes require `Authorization: Bearer <token>`; auth and health routes are public as configured. The canonical docs describe request boundaries and known limitations. Do not assume UI labels imply a working API feature.

## Prerequisites and local development

Install Git, Node.js/npm, JDK 21, and Docker Desktop with Compose. Copy `.env.example` to `.env` in the repository root and configure local values; never commit secrets. Set `JWT_SECRET` to a private, sufficiently long key. `.env.example` is a template, not a credential source.

### Start PostgreSQL and backend with Docker Compose

```powershell
Copy-Item .env.example .env
# Edit .env and set a strong local JWT_SECRET (and OLLAMA_MODEL if using chat).
docker compose up --build
```

Compose starts PostgreSQL and the backend; it does not start the frontend. Backend listens on port 8080 by default. PostgreSQL is available on localhost:5432. The default DB values in the template are for local development only.

### Start the frontend

```powershell
cd frontend
npm install
npm run dev
```

Vite defaults to port 5173. To override the API URL, create `frontend/.env.local` with `VITE_API_BASE_URL=http://localhost:8080/api` (Vite variables are public to the browser; do not put secrets there).

### Run backend natively

With PostgreSQL running and `.env` values available in the shell or IDE environment:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### Tests and builds

```powershell
# Backend tests
cd backend
.\mvnw.cmd test

# Frontend checks
cd ..\frontend
npm test
npm run lint
npm run build
```

## Environment configuration

See [.env.example](.env.example) for the supported template variables: database connection (`DB_*`, `POSTGRES_*`), server/JWT (`SERVER_PORT`, `JWT_SECRET`, `JWT_EXPIRATION`, `SPRING_PROFILES_ACTIVE`), Ollama (`OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TEMPERATURE`, `OLLAMA_TIMEOUT`), and frontend (`VITE_PORT`, `VITE_API_BASE_URL`). For a backend running in Docker, the template uses `host.docker.internal` to reach Ollama on the host. For a backend running natively, use `http://localhost:11434`. Set `OLLAMA_MODEL` to an already available model tag; the application does not download models. No Ollama model is required for ordinary backend/frontend builds or tests.

## Database and API notes

The datasource is PostgreSQL, configured from `DB_URL` or `DB_HOST`/`DB_PORT`/`DB_NAME`. Hibernate updates the schema automatically in the current configuration; the production migration risk is documented in [Bugs and Issues](docs/BUGS_AND_ISSUES.md). Compose persists data in its `upiq-postgres-data` volume. `/api/auth/**` and `/health/**` are public; other API requests require authentication. Transaction and category operations are scoped to the authenticated user.

## Limitations and known risks

- Browser-local budgets and simple run-rate estimates are not server-synchronized or AI predictions. Investment advice, fraud detection, persistent push notifications, and live admin telemetry are not implemented.
- Financial chat supports bounded intents and depends on backend/Ollama for grounded answers. A timeout is not evidence of an incorrect calculation; consult the issue register before drawing performance conclusions.
- Backend CSV parsing exists, but the browser upload UI is PDF-only. Parsing uses heuristic text extraction and does not OCR scanned image PDFs.
- Transaction records have no currency metadata and use a `Double` amount. Do not infer original currency or conversion from display formatting.
- Backend schema uses Hibernate `ddl-auto: update`; a versioned production migration workflow is not yet configured. CORS uses a wildcard origin with credentials disabled; set deployment-specific policy before exposing publicly.
- The research dataset is small, and no answer-quality metrics/statistics exist. Recorded local runtime issues are not evidence that any system performs better.

## Team workflow and documentation

Check `git status` before editing, preserve existing work, and run relevant backend tests/frontend checks. Review `git diff` and `git diff --check`; do not commit secrets, `.env`, model files, generated build output, or local research results. See [Docs/BUGS_AND_ISSUES.md](docs/BUGS_AND_ISSUES.md) for current API/persistence boundaries and audit findings, and [Docs/FUTURE_IMPLEMENTATION.md](docs/FUTURE_IMPLEMENTATION.md) for feature status and the roadmap.
