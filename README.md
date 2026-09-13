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

## Local editing

Create, edit, import, and delete controls are available only through `pnpm dev`
at `http://localhost:3000` (or `http://127.0.0.1:3000`). The development server binds
to `127.0.0.1`; restart any already-running dev server after this change. Keep it
bound to loopback and do not expose it through a tunnel or reverse proxy.

Production (`pnpm build` / `pnpm start`, including on localhost) is read-only for
visitors. Every write action and the notes POST API check access on the server;
request headers cannot enable editing in production. The policy also rejects
non-local hosts, remote forwarded addresses, proxy chains, and cross-origin
requests in development. The lineup builder route is unavailable outside local
development, and registered browsers can read saved lineups and builds. Automatic
synchronization of the versioned game reference data is unchanged.

Run `pnpm test` (Node 22.6+), `pnpm typecheck`, and `pnpm lint` to check the policy
and its protected entry points.

## Invitation access

Run `pnpm dev` and open **http://localhost:3000/invitations/new**. Click
**Generate**, then **Copy code**. No input is required. Each randomly generated
code can register one browser and does not expire before use. An invitation link
containing `?ic=CODE` is also ready to copy and opens the production app at
`https://miniheroes-linup-builder.vercel.app/`.

The generator page and its POST endpoint are available only in local development,
using the same loopback policy as editing. They work before that browser is
registered, so you can generate the first invitation. Production builds do not
expose the generator, including when run on localhost.

Saved lineup cards and detail pages have a **Share** menu. **Copy link** copies
the production lineup URL without invitation codes or other query
parameters. **Copy link with IC** generates a fresh, single-use code and copies
the lineup URL with `?ic=CODE`; this option is available only on localhost.
If clipboard access is blocked, the link is shown for manual copying, and
retrying reuses the invitation that was already generated.

Unregistered browsers see `/invite` and must enter a valid, unused code. Opening
an app URL with `?ic=CODE` submits the code automatically through a POST, then
replaces the address with the original page without `ic`. Other query parameters
and fragments are preserved. Ordinary GET requests and link previews do not redeem
codes. Registered browsers keep access even if a link contains an invalid or used
code; they do not consume additional codes.

Access is remembered by a random HTTP-only cookie for one year, renewed on visits,
and verified against `registered_devices`. Clearing cookies, using a different
browser profile, or switching domains requires a new code. Only hashes of codes
and device tokens are stored. Redemption and registration are atomic, and retries
from the same browser are safe. Deleting a registered-device row revokes its access.

Apply `drizzle/0019_invitation_access.sql` with the normal migration workflow
before running the updated app. It includes RLS policies and grants for
`lineup_app`; follow the transaction-pooler fallback in
[the database notes](docs/mini-heroes-magic-throne.md#how-the-app-models-it)
if needed. Local generation and the deployed app must use the same `DATABASE_URL`.

Pages, metadata, APIs (including health), actions, and original game images require
registration unless a page is explicitly made public as described below.
Framework CSS, JavaScript, fonts, and the favicon remain accessible
to render the invitation screen. Images use their original authenticated URLs;
the shared Next.js image optimizer is disabled to avoid caching private artwork.

`pnpm test` includes invitation routing, input validation, and access checks.
To exercise concurrent claims and transaction rollback, migrate a disposable local
Postgres database and run:

```bash
INVITATION_TEST_DATABASE_URL=postgres://invitation_test@127.0.0.1:55441/invitation_access_test \
  node --experimental-strip-types --test tests/invitations.integration.test.mjs
```

The integration test requires this isolated host, port, user, and database name;
it never uses the app's `DATABASE_URL`.

## Public URLs

Open **http://localhost:3000/public-urls** while running `pnpm dev`, or choose
**Public URLs** in the local navigation. This settings page works without an
invitation and is available only on localhost in development. Paste an app link
or a path such as `/lineups/123`, then click **Add public URL**. The list provides
**Copy link** for the production URL and **Remove** to restore invitation access.

Each entry publishes one exact page path, including its query variations;
`/lineups` does not publish `/lineups/123`. Query strings, fragments and invitation
codes are omitted from stored URLs. Supported pages are Home, About, Notes,
Heroes, Divinities, Lineups and their existing detail routes. Editing routes,
invitation/settings pages and APIs cannot be published. Public viewing does not
register a browser or grant access to actions or private pages.

Public pages include their artwork. Image requests are allowed only when their
same-origin referrer is a currently public page and the image belongs to that
page's content. Other image URLs remain protected. Responses stay uncached so
removing a rule affects subsequent page, navigation and image requests; content
already loaded in a browser cannot be withdrawn.

Apply `drizzle/0023_public_urls.sql` before running this feature. It creates the
empty `public_urls` table with the existing app-only RLS policy. No pages are
public by default. Localhost and production use the same database settings;
production must run the updated code to honor the rules. Changes require no
redeploy once that code is running. The settings page and its mutation endpoint
return 404 in production, including with forged localhost headers.
