# nextjs-fullstack

Personal fullstack starter: Next.js (App Router) · TypeScript · Tailwind v4 · Drizzle ORM · SQLite (libsql) · Zod · Prettier.

## Setup

```bash
cp .env.example .env   # already done on first init
pnpm install
pnpm db:push           # create tables in local.db from src/db/schema.ts
pnpm dev               # http://localhost:3000
```

## Scripts

| Script                               | What it does                                  |
| ------------------------------------ | --------------------------------------------- |
| `pnpm dev` / `build` / `start`       | Next.js                                       |
| `pnpm lint` / `typecheck` / `format` | ESLint, `tsc --noEmit`, Prettier              |
| `pnpm db:push`                       | Sync schema to the DB (fast, dev)             |
| `pnpm db:generate` + `db:migrate`    | Versioned SQL migrations in `drizzle/` (prod) |
| `pnpm db:studio`                     | Browse the DB in Drizzle Studio               |

## Layout

```
src/
  app/            routes (App Router)
    api/          route handlers  (health, notes)
    notes/        server component page + server actions
  db/             drizzle client (index.ts) and schema (schema.ts)
  lib/env.ts      zod-validated environment
drizzle.config.ts
```

## Going to production

Point `DATABASE_URL` (and `DATABASE_AUTH_TOKEN`) at a Turso/libsql database, run `pnpm db:migrate`, and deploy to Vercel or any Node host.
