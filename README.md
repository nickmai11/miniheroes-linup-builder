# nextjs-fullstack

Lineup builder / knowledge base for **Mini Heroes: Magic Throne** — read [docs/mini-heroes-magic-throne.md](docs/mini-heroes-magic-throne.md) first for what the game is, how heroes/roles/rarities work, and how portraits are produced. UI is shadcn/ui (base-nova style on Base UI) with a custom "Throne" theme in `src/app/globals.css` (gold primary, parchment light / navy dark, `next-themes` toggle in the header). Built on a personal fullstack starter: Next.js (App Router) · TypeScript · Tailwind v4 · Drizzle ORM · SQLite (libsql) · Zod · Prettier.

## Setup

```bash
cp .env.example .env   # then paste the Supabase "Transaction pooler" connection string
pnpm install
pnpm db:migrate        # apply drizzle/ migrations (already applied to the current project)
pnpm dev               # http://localhost:3000
```

## Scripts

| Script                               | What it does                                       |
| ------------------------------------ | -------------------------------------------------- |
| `pnpm dev` / `build` / `start`       | Next.js                                            |
| `pnpm lint` / `typecheck` / `format` | ESLint, `tsc --noEmit`, Prettier                   |
| `pnpm db:push`                       | Sync schema straight to the DB (quick experiments) |
| `pnpm db:generate` + `db:migrate`    | Versioned SQL migrations in `drizzle/` (preferred) |
| `pnpm db:studio`                     | Browse the DB in Drizzle Studio                    |

## Layout

```
src/
  app/            routes (App Router)
    api/          route handlers  (health, notes)
    heroes/       hero pool: read-only grid with portraits + role badges
    lineups/      saved lineups, /new builder, /[id] detail
    notes/        server component page + server actions
  components/     ui/ (shadcn), site-header, theme-toggle, page-shell, role-filter,
                  hero-portrait.tsx (portrait tile + class badge)
  data/heroes.ts  seed roster (auto-inserted on first load, idempotent)
  db/             drizzle client (index.ts) and schema (schema.ts)
  lib/            env.ts, heroes.ts, lineups.ts (queries)
public/heroes/    hero portraits; public/badges/ role badges
game-play-screenshots/heroes/  owner's Archive screenshots, the ONLY source of portraits
scripts/slice-hero-cards.py    slices those screenshots into portraits + seed data
docs/             game reference (mini-heroes-magic-throne.md)
drizzle.config.ts
```

## Database

Postgres hosted on Supabase (project `kautapzssaoeanylhfoo`, ap-northeast-1). The app talks to it directly through Drizzle + postgres.js using `DATABASE_URL`; the Supabase REST API is not used, and RLS is enabled on every table with no policies so nothing is exposed through it.

Schema changes: edit `src/db/schema.ts`, run `pnpm db:generate`, then `pnpm db:migrate`. The hero roster in `src/data/heroes.ts` is inserted idempotently on first page load.

## Going to production

Set `DATABASE_URL` to the Supabase pooler string on the host (Vercel or any Node host) and deploy. Uploaded hero portraits are written to `public/heroes/`, which only persists on a host with a writable disk.
