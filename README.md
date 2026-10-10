# UPIQ AI 2.0

UPIQ AI is a college group project exploring personal finance management. It provides transaction tracking, deterministic financial summaries, statement parsing, and a bounded financial assistant. A separate research package supports a question-only/raw-context/verified-context LLM experiment. Product screens include additional prototype features; their implementation status is listed in [docs/FEATURE_STATUS.md](docs/FEATURE_STATUS.md).

## Architecture and stack

- **Frontend:** React 19, Vite 8, Axios, Tailwind CSS 4, Recharts. The active app uses `FinancialContext.currentView` and `activeTab` for navigation; page components are lazy-loaded behind Suspense and an error boundary. Although React Router is a dependency and `src/routes` exists, it is not the active navigation path.
- **Backend:** Java 21, Spring Boot 3.3, Spring Security, stateless JWT authentication, Spring Data JPA, PostgreSQL. PDFBox and Commons CSV support statement parsing; PDFBox also creates report PDFs.
- **Database:** PostgreSQL 16 in Docker Compose. Hibernate is configured with `ddl-auto: update`; use a disposable/local database for development and migrations before production.
- **Assistant:** recognized question intents are resolved and financial results are calculated deterministically. System C grounds its response in verified context and uses Ollama when configured. Ollama is needed for supported AI chat responses, not for the basic application.
- **Research:** separate backend A/B/C prompt adapters, shared Ollama generation boundary, benchmark resources, and opt-in raw-result runner. There are no answer-quality metrics or statistical conclusions.

## Frontend pages and workflows

The current app view switch exposes Home, Login, Dashboard, Transactions, AI Assistant, Insights (also used for the Security tab), Reports, Profile, and an Admin view conditional on the client profile role. The Login screen includes explicit demo choices. Registration and Categories components exist but are not reachable from the active view switch. See [the feature matrix](docs/FEATURE_STATUS.md) for workflow completeness and evidence.

Transactions can be created, viewed, filtered, edited, and deleted through frontend services. Statement upload currently accepts PDF, previews parsed rows, and lets the user save them. The backend parser also accepts CSV, but there is no CSV upload flow in the current UI. The dashboard combines backend financial summary data with client-side widgets. Reports can request an authenticated PDF; the report preview/archive currently uses frontend state and is not a backend report-history workflow.

## Authentication, sessions, and API integration

The backend exposes `POST /api/auth/register` and `POST /api/auth/login`; a successful login returns an `ApiResponse` with `data.token`. The frontend validates saved JWT structure before restoring a backend session, stores the bearer token, and attaches it to protected Axios requests. Client-side token structure validation is not token authenticity validation; the backend validates protected requests. A protected 401 clears auth/session storage, resets in-memory user state, and returns the app to Login without reloading. Demo login is an explicit local demo path and is separate from backend authentication. Google login is unavailable.

The frontend API base defaults to `http://localhost:8080/api` (`VITE_API_BASE_URL`). Implemented API paths include `/api/transactions`, `/api/categories`, `/api/pdf/upload`, `/api/financial/dashboard`, `/api/financial/report`, `/api/financial-chat`, `/api/auth`, `/api/v1/users`, and health routes. Protected routes require `Authorization: Bearer <token>`; auth and health routes are public as configured. See [docs/API.md](docs/API.md) for methods and payload details. Do not assume UI labels imply a working API feature.

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

The datasource is PostgreSQL, configured from `DB_URL` or `DB_HOST`/`DB_PORT`/`DB_NAME`. Hibernate updates the schema automatically in the current development configuration. Compose persists data in its `upiq-postgres-data` volume. `/api/auth/**` and `/health/**` are public; other API requests require authentication. Transaction and category operations are designed to scope records to the authenticated user. API reference: [docs/API.md](docs/API.md).

## Limitations and known risks

- Budget/forecast, investment, fraud, notification, and admin screens contain prototype or local/demo state; they do not represent complete backend services. Budgets are not synced across devices.
- Financial chat handles a bounded set of intents and depends on backend/Ollama for grounded answers. The frontend contains heuristic fallback responses with hard-coded example claims; treat those claims as prototype behavior, not account analysis.
- Report PDF generation is backed by the API, but the report archive/preview has incomplete frontend state wiring and may not be available for a newly logged-in account.
- Backend CSV parsing exists, but upload UI is PDF-only. Parsing uses text extraction and does not OCR scanned image PDFs.
- Registration role assignment and authenticated user-directory endpoints need authorization review before public deployment. CORS currently allows any origin (credentials are disabled).
- Financial transaction data has no currency metadata in the backend calculation model; do not infer currency from calculated values.
- The research dataset is small, and no evaluation metrics/statistics exist. Recorded local System B runtime issues are not evidence that any system performs better.

## Team workflow and documentation

Check `git status` before editing, work on a focused branch, and run the relevant backend tests/frontend checks. Review `git diff` and `git diff --check`; do not commit secrets, `.env`, model files, generated build output, or local research results. The technical handover is [docs/PROJECT_IMPLEMENTATION_GUIDE.md](docs/PROJECT_IMPLEMENTATION_GUIDE.md); feature coverage is [docs/FEATURE_STATUS.md](docs/FEATURE_STATUS.md), known issues [docs/BUGS_AND_LIMITATIONS.md](docs/BUGS_AND_LIMITATIONS.md), and endpoint reference [docs/API.md](docs/API.md).
