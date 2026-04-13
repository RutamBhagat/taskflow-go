FROM oven/bun:1.3.3 AS build

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile
RUN bun run --filter server build

FROM oven/bun:1.3.3-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY packages/config/package.json ./packages/config/
COPY packages/env/package.json ./packages/env/
COPY packages/env/src ./packages/env/src
COPY packages/db/package.json ./packages/db/
COPY packages/db/drizzle.config.ts ./packages/db/
COPY packages/db/src ./packages/db/src
COPY --from=build /app/apps/server/dist ./apps/server/dist

RUN bun install --frozen-lockfile --production

EXPOSE 4000

CMD ["sh", "-c", "cd /app/packages/db && export DATABASE_URL=\"postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}\" && bun run db:migrate:up && bun run db:seed && cd /app && bun run --filter server start"]
