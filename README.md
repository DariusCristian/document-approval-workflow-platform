# DocFlow – Document Approval Workflow Platform

DocFlow is a full-stack app for writing documents and getting them approved. Authors write documents and submit them for review, reviewers approve or reject them, and everyone can discuss a document in its comments.

## Workflow

```text
DRAFT ──(author submits)──> IN_REVIEW ──(reviewer/admin decides)──> APPROVED
                                                               └──> REJECTED
```

- New documents start as **DRAFT**.
- Only the document's author can submit it for review (**DRAFT → IN_REVIEW**).
- A **REVIEWER** or **ADMIN** approves or rejects an IN_REVIEW document by recording a decision. This sets the status to **APPROVED** or **REJECTED**.
- APPROVED and REJECTED are final.

## Features

- Session-based login and logout, with the current user loaded from the server on page load
- Three roles: `ADMIN`, `REVIEWER` and `AUTHOR`
- Create, list and view documents
- Submit for review, then approve or reject, with a decision history per document
- Comments on documents
- Buttons shown according to role and document status (the server enforces the same rules)
- Request validation and consistent JSON errors: `{ "status": ..., "message": ... }`
- PostgreSQL schema managed by Flyway migrations
- Demo data and a database reset script for local development

## Tech stack

| Backend | Frontend |
|---|---|
| Java 21, Spring Boot 4 | React 19, TypeScript |
| Spring Security 7 (sessions, CSRF) | Vite 8 (dev server proxies `/api` to the backend) |
| Spring Data JPA, Hibernate | React Router 7 |
| PostgreSQL, Flyway | ESLint |
| Gradle | |

## Project structure

```text
.
├── backend/                     Spring Boot app (Java package: com.docflow.backand)
│   ├── build.gradle
│   └── src/main/
│       ├── java/com/docflow/backand/
│       │   ├── approval/        approval decisions (domain, repository, service, web)
│       │   ├── auth/web/        login, logout, /me, CSRF token endpoint
│       │   ├── comment/         document comments
│       │   ├── common/          ForbiddenException, global JSON error handler
│       │   ├── config/          SecurityConfig, DevDataSeeder
│       │   ├── document/        documents and status changes
│       │   ├── security/        UserDetailsService and principal
│       │   └── user/            users and roles
│       └── resources/
│           ├── application.yml
│           └── db/migration/    Flyway migrations V1–V5
├── frontend/                    React app
│   └── src/
│       ├── api/                 fetch client (CSRF header, 401 handling) and API calls
│       ├── app/                 AuthProvider and useAuth
│       └── pages/               Login, Documents, Create Document, Document Detail
└── scripts/
    └── reset-db.sh              resets the local database
```

## Running locally

### Prerequisites
- Java 21
- Node.js 20.19+ or 22.12+
- PostgreSQL running on `localhost:5432`, with the `psql`, `createdb` and `dropdb` command-line tools

### 1. Database
```bash
./scripts/reset-db.sh
```
This creates the `docflow_user` role if it doesn't exist yet. It then **drops** and recreates the `docflow_db` database, so stop the backend first. The connection settings are in `backend/src/main/resources/application.yml`.

### 2. Backend
```bash
cd backend
./gradlew bootRun
```
- Runs on http://localhost:8080 with the `dev` profile.
- On startup, Flyway creates the tables.
- If the database has no users yet, the dev seeder adds the demo accounts and sample documents.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. The Vite dev server forwards `/api` requests to the backend.

### Demo accounts
All demo accounts use the password `password123`.

| Email | Role |
|---|---|
| admin@docflow.local | ADMIN |
| reviewer@docflow.local | REVIEWER |
| author1@docflow.local | AUTHOR |
| author2@docflow.local | AUTHOR |

The seed data has one document in each status, including an IN_REVIEW document written by the reviewer. You can use it to try the four-eyes rule.

## Security design

### Session-based authentication
- `POST /api/auth/login` checks the password (BCrypt hash) and stores the user in a server-side HTTP session. The browser keeps only an HttpOnly `JSESSIONID` cookie.
- The session ID changes on login, which prevents session fixation.
- `GET /api/auth/me` returns the logged-in user. `POST /api/auth/logout` ends the session.
- Every endpoint except login and the CSRF token endpoint requires a login. Without one, the response is `401`.

**Why sessions instead of JWT:**
- **Logout takes effect immediately:** the server can end a session at once. A JWT stays valid until it expires.
- **JavaScript can't read the login:** the session cookie is HttpOnly, so a script injected into the page can't steal it.
- **It fits this setup:** the app has one backend and a frontend served from the same origin, so tokens and refresh logic would add complexity for no benefit.

**The trade-offs:**
- Cookie-based auth needs CSRF protection (see below).
- Sessions live in the backend's memory, so a restart logs everyone out.

### The server decides who you are
- Requests never contain user IDs. When a document, comment or decision is created, the backend takes the author from the session.
- The frontend asks `/api/auth/me` on load instead of trusting `localStorage`.
- Any `401` sends the user to the login page with a "session expired" message.

### Role rules
The services enforce these rules. A violation returns `403` with a clear message.

| Action | Allowed for |
|---|---|
| Approve or reject a document | `REVIEWER` and `ADMIN`, **never on their own document** |
| Submit a document for review (`DRAFT → IN_REVIEW`) | only the document's author |
| Create users | `ADMIN` only |
| Create, list and view documents; comment | any logged-in user |

- **Four-eyes rule:** nobody can decide on a document they wrote, admins included.
- **Status endpoint:** it only allows `DRAFT → IN_REVIEW`. Any other transition returns `400`, because APPROVED and REJECTED can only be reached through a decision.

### CSRF protection
- The backend uses Spring Security's SPA CSRF support. It puts a random token in an `XSRF-TOKEN` cookie that JavaScript can read.
- The frontend sends that token back in an `X-XSRF-TOKEN` header on every POST, PUT, PATCH and DELETE.
- Another website can make the browser *send* our cookies, but it can't *read* them, so it can't forge that header.
- Login is protected too, to prevent "login CSRF", where an attacker logs you into their account.
- `GET /api/auth/csrf` hands out a token before the first login. The token is renewed on login and logout.

## Next steps
- **Tests:** there is only a Spring context-load test so far. Add integration tests for the role rules, the four-eyes rule and CSRF.
- **Docker Compose** for PostgreSQL, the backend and the frontend.
- **UI redesign:** the current frontend only has the Vite template's base styles.
