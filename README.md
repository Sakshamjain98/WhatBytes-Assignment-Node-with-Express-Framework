# Healthcare Backend API

A REST API where users register, log in with JWT, and manage patients, doctors and patient–doctor assignments.
Built with **Node.js 22, TypeScript, Express 5 and PostgreSQL 16**.

**Stack:** TypeScript (strict) · Express 5 · PostgreSQL · Sequelize ORM · Umzug migrations · JWT access/refresh tokens · bcrypt · Zod DTO validation · Pino structured logging · Helmet · CORS · rate limiting · Swagger/OpenAPI 3 · Docker Compose · GitHub Actions CI

## Quick start

```bash
docker compose up --build
```

| URL                                 |                                         |
| ----------------------------------- | --------------------------------------- |
| http://localhost:3000/api/docs      | Swagger UI (interactive docs)           |
| http://localhost:3000/api/docs.json | OpenAPI 3 spec (import into Postman)    |
| http://localhost:3000/health        | Health check (includes database status) |

Database migrations run automatically on startup. To change secrets or ports, copy `.env.example` to `.env` and edit it; Compose reads it automatically.

### Local development (without Docker for the API)

```bash
cp .env.example .env
docker compose up -d db          # or use your own Postgres and update DATABASE_URL
npm ci
npm run dev                      # hot reload via tsx
```

## Scripts

| Command                                             | Purpose                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`                                       | Start with hot reload                                                         |
| `npm run build` / `npm start`                       | Compile to `dist/` and run the compiled build                                 |
| `npm test`                                          | Unit tests for the service layer (repositories are faked, so no DB is needed) |
| `npm run test:e2e`                                  | End-to-end test of every endpoint against the running stack                   |
| `npm run lint` / `npm run typecheck`                | ESLint (typescript-eslint) / `tsc --noEmit`                                   |
| `npm run format`                                    | Prettier                                                                      |
| `npm run db:migrate -- up\|down\|pending\|executed` | Manage migrations by hand                                                     |

## Architecture

A layered, feature-based structure. Each request flows **route → controller → service → repository → model**:

- **Routes** connect URLs to middleware (auth, DTO validation) and controller methods.
- **Controllers** are a thin HTTP layer: they read the request and send the response.
- **Services** hold the business rules (ownership checks, 404/403/409 decisions) and return response DTOs.
- **Repositories** are the only code that talks to the ORM. Services depend on them through constructor injection.
- **DTOs** come in two kinds. Request DTOs are Zod schemas with types generated from them via `z.infer`. Response DTOs are interfaces with explicit mapper functions, so internal fields such as password hashes can never leak.

```
src/
├── server.ts                     # bootstrap: DB connect, migrations, graceful shutdown
├── app.ts                        # Express app: security, logging, docs, routes, error handling
├── routes.ts                     # mounts module routers under /api
├── container.ts                  # composition root (dependency injection wiring)
├── config/
│   ├── env.ts                    # environment variables checked with Zod at startup
│   └── logger.ts                 # pino logger (redacts auth headers and passwords)
├── database/
│   ├── sequelize.ts              # connection + pool
│   ├── migrator.ts / migrate.ts  # Umzug migrator + CLI
│   └── migrations/               # versioned schema migrations
├── common/
│   ├── dto/                      # shared DTOs (id param, error response)
│   ├── errors/app-error.ts       # typed HTTP errors (NotFound, Forbidden, Conflict, ...)
│   ├── middlewares/              # authenticate, validateBody, error handler
│   └── utils/
├── docs/openapi.ts               # OpenAPI 3 document
├── types/                        # Express request augmentation, typed request
└── modules/
    ├── auth/        auth.{routes,controller,service,dto}.ts, token.service.ts
    ├── users/       user.{model,repository,dto}.ts
    ├── patients/    patient.{routes,controller,service,repository,model,dto}.ts + spec
    ├── doctors/     doctor.{routes,controller,service,repository,model,dto}.ts + spec
    └── mappings/    mapping.{routes,controller,service,repository,model,dto}.ts + spec
test/api.e2e.ts                   # end-to-end test
```

## API

All endpoints except `/api/auth/*` need `Authorization: Bearer <accessToken>`.

| Method | Endpoint                    | Description                                                                               |
| ------ | --------------------------- | ----------------------------------------------------------------------------------------- |
| POST   | `/api/auth/register/`       | Register (`name`, `email`, `password` 8–72 chars) → user + tokens                         |
| POST   | `/api/auth/login/`          | Log in → user + access token (15 min) + refresh token (7 days)                            |
| POST   | `/api/auth/refresh/`        | Exchange a refresh token for a new token pair                                             |
| POST   | `/api/patients/`            | Create a patient (`name`, `age`, `gender`, optional `phone`, `address`, `medicalHistory`) |
| GET    | `/api/patients/`            | List patients created by the current user (paginated)                                     |
| GET    | `/api/patients/:id/`        | Get a patient                                                                             |
| PUT    | `/api/patients/:id/`        | Update a patient (any subset of fields)                                                   |
| DELETE | `/api/patients/:id/`        | Delete a patient (its mappings are removed too)                                           |
| POST   | `/api/doctors/`             | Create a doctor (`name`, `specialization`, optional `email`, `phone`, `experienceYears`)  |
| GET    | `/api/doctors/`             | List all doctors (paginated)                                                              |
| GET    | `/api/doctors/:id/`         | Get a doctor                                                                              |
| PUT    | `/api/doctors/:id/`         | Update a doctor (creator only)                                                            |
| DELETE | `/api/doctors/:id/`         | Delete a doctor (creator only)                                                            |
| POST   | `/api/mappings/`            | Assign a doctor to a patient (`patientId`, `doctorId`)                                    |
| GET    | `/api/mappings/`            | List all mappings for the current user's patients (paginated)                             |
| GET    | `/api/mappings/:patientId/` | List the doctors assigned to a patient                                                    |
| DELETE | `/api/mappings/:id/`        | Remove an assignment (by mapping id)                                                      |

### Pagination

The list endpoints accept `?page=` (default 1) and `?limit=` (default 20, max 100) and return:

```json
{ "data": [], "meta": { "page": 2, "limit": 20, "total": 42, "totalPages": 3 } }
```

`GET /api/mappings/:patientId/` returns every doctor assigned to that one patient, without pagination.

### Access rules

- **Patients** are private: users see and manage only the patients they created. Other users get `404`, so the API doesn't reveal which ids exist.
- **Doctors** are a shared directory: any logged-in user can view them and assign them to their own patients, but only the creator can edit or delete one (`403` otherwise).
- **Mappings** are only visible and changeable through patients you own. Assigning the same doctor to the same patient twice returns `409`; a unique database index also enforces this.

### Errors

Every error response uses the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "age", "message": "Number must be greater than or equal to 0" }]
  }
}
```

Codes: `400 VALIDATION_ERROR / BAD_REQUEST` · `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` · `409 CONFLICT` · `429 TOO_MANY_REQUESTS` · `500 INTERNAL_ERROR` (no internal details are exposed).

## Security and production practices

- Passwords are hashed with bcrypt (configurable cost) and never serialized.
- Access and refresh tokens use separate secrets with HS256 pinned, so neither can be used as the other.
- Helmet sets the security headers, CORS is configurable, and request bodies are capped at 100 kb.
- Login, register and refresh are rate-limited (20 requests per 15 minutes per IP by default).
- Every query is scoped by owner inside the repositories. Request DTOs are strict, so unknown fields are rejected.
- Pino JSON logs carry a request ID (`X-Request-Id` is echoed back), and the `Authorization` header and passwords are redacted.
- Environment variables are checked at startup, so the app fails fast on bad config.
- Migrations are versioned and run in a transaction. Foreign keys are indexed and cascade on delete.
- Shutdown is graceful on SIGTERM/SIGINT, and the health check also checks the database.
- The Docker build is multi-stage, runs as a non-root user and includes a container health check.
- CI (GitHub Actions) runs format check, lint, typecheck, unit tests and the build, then the end-to-end test against `docker compose`.
