# Faculty Academic Management System — Backend

**TypeScript** + Express + Sequelize (MySQL) REST API for teachers to manage
classrooms, subjects, exams and student marks. Built with a **factory-pattern
architecture** and fully documented with **Swagger/OpenAPI**.

## Architecture (factory-driven)

Everything is created by factory functions and wired in one composition root
(`src/container.ts`). Layers are built bottom-up and dependencies are injected —
no scattered `new`, fully typed, easy to test.

```
models  →  repositories  →  services  →  controllers  →  routes
                         (container.ts wires them together)
```

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Models | `src/models/*.model.ts` | Class-based Sequelize models (`InferAttributes`) + init factories + associations |
| Repositories | `src/repositories/*` | The only layer that touches models (generic base + typed domain repos) |
| Services | `src/services/*` | Business logic (auth, marks, grading, analytics, export) |
| Controllers | `src/controllers/*` | HTTP glue — read req, call service, send response |
| Routes | `src/routes/*` | Express routers + Swagger annotations |
| Middleware | `src/middleware/*` | Auth guard, validation, central error handling |
| Container | `src/container.ts` | Composition root wiring all of the above |

Every registry exports a `ReturnType` type (`Repositories`, `Services`,
`Controllers`), so the whole graph is type-checked end to end.

## Prerequisites

- Node.js 18+ (tested on 24)
- A running MySQL server

## Setup

```bash
cd server
npm install
cp .env.example .env      # then edit .env (see below)
```

Edit `.env` and set at least your MySQL credentials:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=faculty_ams
DB_USER=root
DB_PASSWORD=your_mysql_password
```

## Create schema + seed data

```bash
npm run db:reset          # drops+recreates tables, then seeds  (destructive)
# or step by step:
npm run db:sync:force     # (re)create all tables
npm run db:seed           # load master data + sample marks
```

The seed creates the database if it doesn't exist, sets up an active academic
year (2025-26), classes/sections/subjects/students, teaching assignments and
some sample marks so the dashboard has data.

### Seeded logins (password: `Password123`)

| Email | Subject | Notes |
|-------|---------|-------|
| anita@school.edu | Mathematics | Has sample marks + change logs |
| rahul@school.edu | Science | |
| meera@school.edu | English | |

## Run

```bash
npm run dev        # tsx watch (hot reload)
npm run build      # compile TypeScript -> dist/
npm start          # run compiled dist/server.js
npm run typecheck  # tsc --noEmit
```

- API base: `http://localhost:5000`
- Swagger UI: `http://localhost:5000/api/docs`
- Health: `http://localhost:5000/api/health`

## Auth

Three login methods, all resolving to the same teacher account (matched by email);
self sign-up is allowed and claims a pre-seeded account sharing the email.

1. **Email + password** — `/api/auth/signup`, `/api/auth/login`
2. **Email OTP** — `/api/auth/otp/request` then `/api/auth/otp/verify`
   (no SMTP configured → the code is logged to the console and returned as
   `data.devCode` in non-production)
3. **Google** — `/api/auth/google` with a Google ID token (needs `GOOGLE_CLIENT_ID`)

Access tokens are returned in the response body; refresh tokens are also set as an
httpOnly cookie. Send the access token as `Authorization: Bearer <token>`.

## Notes

- Grades are computed from `score / exam.maxMarks` using the bands in
  `.env`/config (A+ ≥90, A ≥80, B ≥70, C ≥60, D ≥40, F <40; pass at 40%).
- Every marks create/update is written to `score_change_logs` in the same
  transaction; a teacher only ever sees logs for his own classes.
- Schema is created via `sequelize.sync` (models are the source of truth). To move
  to versioned migrations later, add `sequelize-cli` migrations.
