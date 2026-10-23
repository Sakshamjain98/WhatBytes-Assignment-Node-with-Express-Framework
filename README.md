# Healthcare Backend (Node.js · Express · PostgreSQL)

A REST API where users register, log in with JWT, and manage patients, doctors and patient–doctor assignments.
It's the WhatBytes Django assignment, built with the Node.js stack instead.

**Stack:** Express 5 · PostgreSQL 16 · Sequelize ORM · JWT (`jsonwebtoken`) · bcrypt · Zod validation · Swagger UI · Docker Compose

## Quick start

```bash
docker compose up --build
```

- API: http://localhost:3000
- Swagger docs: http://localhost:3000/api/docs (OpenAPI JSON at `/api/docs.json`)
- Health check: http://localhost:3000/health

Tables are created automatically on first boot. To change secrets or ports, copy `.env.example` to `.env` and edit it; Compose reads it automatically.

### Run without Docker

```bash
cp .env.example .env   # point DATABASE_URL at your own Postgres
npm install
npm run dev
```

## Tests

End-to-end test of every endpoint against the running stack (Node's built-in test runner, no extra dependencies):

```bash
docker compose up -d --build
npm test
```

## API

All endpoints except auth need `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register (`name`, `email`, `password` ≥ 8 chars) → user + JWT |
| POST | `/api/auth/login/` | Log in → user + JWT |
| POST | `/api/patients/` | Create a patient (`name`, `age`, `gender`, optional `phone`, `address`, `medicalHistory`) |
| GET | `/api/patients/` | List patients created by the current user |
| GET | `/api/patients/:id/` | Get one patient |
| PUT | `/api/patients/:id/` | Update a patient (any subset of fields) |
| DELETE | `/api/patients/:id/` | Delete a patient (its mappings are removed too) |
| POST | `/api/doctors/` | Create a doctor (`name`, `specialization`, optional `email`, `phone`, `experienceYears`) |
| GET | `/api/doctors/` | List all doctors |
| GET | `/api/doctors/:id/` | Get one doctor |
| PUT | `/api/doctors/:id/` | Update a doctor (creator only) |
| DELETE | `/api/doctors/:id/` | Delete a doctor (creator only) |
| POST | `/api/mappings/` | Assign a doctor to a patient (`patientId`, `doctorId`) |
| GET | `/api/mappings/` | List all mappings for the current user's patients |
| GET | `/api/mappings/:patientId/` | List the doctors assigned to a patient |
| DELETE | `/api/mappings/:id/` | Remove an assignment (by mapping id) |

### Access rules
- **Patients** are private: each user sees and manages only the patients they created.
- **Doctors** are a shared directory: any logged-in user can view them and assign them to their own patients, but only the user who created a doctor can edit or delete it.
- **Mappings** are only visible and changeable through patients you own. Assigning the same doctor to the same patient twice returns `409`.

### Errors
Every error response uses the same JSON shape:
```json
{ "error": "Validation failed", "details": [{ "field": "age", "message": "Number must be greater than or equal to 0" }] }
```
`400` invalid input / malformed JSON · `401` missing or bad token · `403` not the owner · `404` not found · `409` duplicate.

## Project structure

```
src/
  server.js           boot: connect DB, sync tables, graceful shutdown
  app.js              Express app, routes, Swagger
  config.js           env vars (fails fast if required ones are missing)
  db.js               Sequelize models + associations + indexes
  validators.js       Zod request schemas
  openapi.js          OpenAPI 3 spec served by Swagger UI
  middleware/         JWT auth, central error handler
  routes/             auth, patients, doctors, mappings
test/api.test.js      end-to-end test
```

## Notes
- Passwords are hashed with bcrypt and never returned. Email addresses are case-insensitive.
- Foreign keys are indexed, and the `(patient_id, doctor_id)` pair has a unique index.
- Tables are created with `sequelize.sync()`. A production setup would use migrations.
