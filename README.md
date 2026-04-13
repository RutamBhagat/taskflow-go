# taskflow-elysia

## Overview

TaskFlow is a backend-first task management API built with Elysia, Bun, and Drizzle on PostgreSQL.
It implements authentication, project access control, task CRUD, and a small seed dataset for review.

## Architecture Decisions

The backend is split by feature, not by abstract layer.
`auth`, `projects`, and `tasks` each expose an Elysia plugin under `apps/server/src/router/`, while the app shell in `apps/server/src/app.ts` stays responsible for cross-cutting concerns like CORS, validation mapping, and request logging.

That is the smallest structure that still stays readable:

- auth owns JWT setup and login/register behavior
- projects owns project visibility and project-scoped task listing
- tasks owns task mutation and deletion authorization
- shared helpers stay in `apps/server/src/shared/` when the logic is genuinely reused

I intentionally did not add service/repository abstractions because the current surface area does not justify them yet.
That would add indirection without improving the code.

## Tech Stack

- Bun
- Elysia
- Drizzle ORM
- PostgreSQL
- Pino for structured logs

## Running Locally

The project is meant to be started through Docker.

```bash
git clone <your-repo-url>
cd taskflow-elysia
cp .env.example .env
docker compose up --build
```

The API starts on `http://localhost:4000`.

Seed data includes:

- 1 user: `seed@example.com`
- password: `Password123!`
- 1 project
- 3 tasks with `todo`, `in_progress`, and `done`

## Docker

- `docker-compose.yml` at the repo root starts PostgreSQL and the API
- the API image uses a multi-stage Bun build in `apps/server/Dockerfile`
- the API container reads variables from the root `.env` file via `env_file`
- migrations and seeding run automatically before the server starts
- PostgreSQL credentials stay configurable through `.env`

## Migrations

- Migrations are managed with `drizzle-migrations`
- `packages/db/src/migrations/*` contains paired `up` and `down` functions for every migration file
- container startup runs `bun run --filter @taskflow-elysia/db db:migrate:up`
- seed data runs immediately after migrations with `bun run --filter @taskflow-elysia/db db:seed`

## Project Structure

```text
apps/server/src/app.ts          # shared app shell and global middleware
apps/server/src/router/         # feature routers: auth, projects, tasks
apps/server/src/shared/         # shared HTTP helpers and logging
packages/db/src/schema/         # Drizzle schema definitions
packages/db/src/migrations/     # migration history
packages/db/src/seed.ts         # bootstrap seed data
```

## Scripts

- `bun run dev`: start all workspace packages in development
- `bun run dev:server`: start only the API server
- `bun run db:migrate:up`: apply pending migrations
- `bun run db:migrate:down`: roll back the last migration
- `bun run db:seed`: seed the database with review data
- `bun run check`: format and lint the repo
