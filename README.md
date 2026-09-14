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

`vercel.json` pins server functions to Tokyo (`hnd1`), alongside the Supabase
database in `ap-northeast-1`. Keep the function region aligned with the database
if it moves: repeated queries across continents add latency to pages and APIs.
Region changes take effect on the next deployment. See
[the performance review](docs/page-performance.md) for deployment measurements.

## Admin login and editing

Click **Admin login** in the header and enter your Supabase Auth email and
password. The dialog is also available on the invitation screen; admins do not
need an invitation code. Authentication uses the official `@supabase/supabase-js`
and `@supabase/ssr` packages.

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the
existing project's **Connect** dialog in `.env.local` and your deployment's
environment settings. Restart or redeploy after changing them. Use a publishable
(or legacy anon) key, never a service-role or secret key in these variables.

Admin accounts must exist in Supabase **Authentication → Users** and have
`app_metadata.role` set to `admin` through
Supabase's trusted administration tools. Admin checks use `auth.getUser()` to
verify the session and read current server-managed metadata; user-editable
`user_metadata` cannot grant access. Additional admins can be managed through
the same Supabase role. Removing the role removes access on subsequent requests.

Supabase manages passwords, session expiry, refresh tokens, and authentication
rate limits. The Next.js proxy refreshes sessions and forwards updated cookies to
both the browser and Server Components. Passwords and a custom signing secret
are not stored in app environment variables. Auth runs on the server, and SDK
session cookies are HTTP-only and require HTTPS in production.

Signed-in admins can create, edit, import, and delete content, generate invitation
codes, and manage public URLs. **Sign out** signs out the current Supabase session
while preserving the browser's existing invitation registration. Admin login
does not register a visitor's browser or consume an invitation code, and requires
no application database migration.

### Local development

Run `pnpm dev` and sign in as admin at `http://localhost:3000` (or
`http://127.0.0.1:3000`) to edit content. The development server binds to
`127.0.0.1`. Localhost and development mode do not grant feature access; the same
admin requirement applies on every host and in production.

Content writes and management APIs check admin access on the server. The lineup
builder also requires admin login, and registered browsers can read saved lineups
and builds. Automatic synchronization of the versioned game reference data is
unchanged.

Run `pnpm test` (Node 22.6+), `pnpm typecheck`, and `pnpm lint` to check the policy
and its protected entry points.

## Invitation access

Sign in as admin and choose **Invitations** (locally,
**http://localhost:3000/invitations/new**). Click
**Generate**, then **Copy code**. No input is required. Each randomly generated
standalone code grants one browser full-library access and does not expire
before use. An invitation link containing `?ic=CODE` is also ready to copy and
opens the app on the browser's current origin, including its port.

The former address `miniheroes-linup-builder.vercel.app` stays attached to the
same deployment and forwards every page to the new one, keeping unused
invitation links intact. A browser registered on the old address is moved
along: the proxy there adds a sealed, two-minute copy of its device token to
the redirect, and the new address exchanges that copy for a fresh cookie,
retiring the old one only at that moment. The seal is derived from
`DATABASE_URL`, which every host already shares. Do not set a Vercel-level
redirect on the old domain, or that hand-off never runs and existing visitors
would need a fresh invitation. The hosts are listed in `src/lib/site-url.ts`.

The generator page and its POST endpoint are available only to signed-in admins,
using the same access policy as editing. They work before that browser is
registered, so you can generate the first invitation.

Saved lineup cards and detail pages have a **Share** menu. **Copy link** copies
the lineup URL on the browser's current origin without invitation codes or other query
parameters. **Copy link with IC** generates a fresh, single-use code and copies
the lineup URL with `?ic=CODE`; this option requires admin access. This code grants
access only to that lineup. A browser can redeem codes for multiple lineups,
and `/lineups` shows its invited lineups. Other private pages and APIs stay
locked. The lineup’s formation, assigned build previews, pets, relics, fishes,
and artwork remain viewable. Standalone codes can upgrade a scoped browser
to full-library access.
If clipboard access is blocked, the link is shown for manual copying, and
retrying reuses the invitation that was already generated.

Unregistered browsers see `/invite` and can enter a valid, unused code or sign in
as admin. Opening
an app URL with `?ic=CODE` submits the code automatically through a POST, then
replaces the address with the original page without `ic`. Other query parameters
and fragments are preserved. Ordinary GET requests and link previews do not redeem
codes. Browsers with full-library access do not consume additional codes.
Scoped browsers redeem new codes to add access, and a retry of a redeemed code
works only for its original browser. Existing access survives an invalid code.
If automatic redemption fails, the supplied code remains in the form for retry.

Access is remembered by a random HTTP-only cookie for one year, renewed on visits,
and verified against `registered_devices`. Clearing cookies, using a different
browser profile, or switching domains requires a new code. Only hashes of codes
and device tokens are stored. Redemption and registration are atomic, and retries
from the same browser are safe. Deleting a registered-device row revokes its access.

Apply migrations through `drizzle/0026_lineup_invitations.sql` with the normal
migration workflow before running the updated app. Migration 0026 adds scoped
invitations and a device-to-invitation redemption table, backfills existing
devices with their full-library grants, and includes RLS policies and grants for
`lineup_app`; follow the transaction-pooler fallback in
[the database notes](docs/mini-heroes-magic-throne.md#how-the-app-models-it)
if needed. Local generation and the deployed app must use the same `DATABASE_URL`.

If pages return **Access is temporarily unavailable**, check the server log's
`Access operation failed` entry. Codes `42P01` (missing table) or `42703`
(missing column) indicate an unapplied schema migration. In particular, running
the scoped-invitation code before migration 0026 breaks device lookups.
Diagnostics omit invitation codes, device cookies, and SQL parameters.

Pages, metadata, APIs (including health), actions, and original game images require
the appropriate invitation scope or an admin session unless a page is explicitly
made public as described below. Scoped artwork access is limited to the invited
lineup or filtered lineup list identified by a same-origin referrer.
Framework CSS, JavaScript, fonts, and the favicon remain accessible
to render the invitation screen. Images use their original authenticated URLs;
the shared Next.js image optimizer is disabled to avoid caching private artwork.
Authorized PNG responses are cached privately in the browser: current `?v=` URLs
for one year, and unversioned or older URLs with revalidation on every use. Bump
`ASSET_VERSION` in `src/lib/asset-version.ts` whenever artwork is replaced. Image
caches vary by cookie and referrer; shared caches cannot store them. Pages, APIs,
redirects, and access-denied responses remain `private, no-store`.

`pnpm test` includes invitation routing, input validation, and access checks.
To exercise concurrent claims and transaction rollback, migrate a disposable local
Postgres database and run:

```bash
INVITATION_TEST_DATABASE_URL=postgres://invitation_test@127.0.0.1:55441/invitation_access_test \
  node --experimental-strip-types --test tests/invitations.integration.test.mjs
```

The integration test requires this isolated host, port, user, and database name;
it never uses the app's `DATABASE_URL`.

To exercise the complete lineup invitation flow, run a separate app at
`http://127.0.0.1:3111` against that same disposable database with Supabase Auth
disabled, then run:

```bash
INVITATION_TEST_BASE_URL=http://127.0.0.1:3111 \
INVITATION_TEST_DATABASE_URL=postgres://invitation_test@127.0.0.1:55441/invitation_access_test \
  node --experimental-strip-types --test tests/lineup-invitations.http.test.mjs
```

This test creates temporary lineups and invitations, redeems two links through
the real HTTP endpoint, and checks filtered HTML/RSC, assigned builds, artwork,
private-page denial, single-use codes, and retry behavior. It cleans up its fixtures.

## Public URLs

Sign in as admin and choose **Public URLs** (locally,
**http://localhost:3000/public-urls**). This settings page
works without an invitation for signed-in admins on every host. Paste an app link
or a path such as `/lineups/123`, then click **Add public URL**. The list provides
**Copy link** for the browser's current origin and **Remove** to restore invitation access.

Each entry publishes one exact page path, including its query variations;
`/lineups` does not publish `/lineups/123`. Query strings, fragments and invitation
codes are omitted from stored URLs. Supported pages are Home, About, Notes,
Heroes, Divinities, Lineups and their existing detail routes. Editing routes,
invitation/settings pages and APIs cannot be published. Public viewing does not
register a browser or grant access to actions or private pages.

Public pages include their artwork. Image requests are allowed only when their
same-origin referrer is a currently public page and the image belongs to that
page's content. Other image URLs remain protected. Page responses stay uncached,
so removing a rule affects subsequent page and navigation requests, and image
requests that reach the server. Previously cached artwork can remain available
in that browser until its cache expires or is cleared.

Apply `drizzle/0023_public_urls.sql` before running this feature. It creates the
empty `public_urls` table with the existing app-only RLS policy. No pages are
public by default. Localhost and production use the same database settings;
production must run the updated code to honor the rules. Changes require no
redeploy once that code is running. The settings page and its mutation endpoint
return 404 for visitors without an admin session, including on localhost in
development.

## Languages

The interface supports English and Vietnamese. The header language selector saves
`mini-heroes-locale` for one year. On a first visit, the app uses the browser's
`Accept-Language` preference, falling back to English. The server and client use
the same resolved locale, including page metadata and the document's `lang`.
Switching language refreshes server content while preserving client form state,
the current URL, query parameters, and hash. Invitation and shared lineup URLs
remain language-independent.

Translations live in `src/lib/i18n/vi.json`, keyed by the English source message.
Use `getI18n()` from `src/lib/i18n/server.ts` in Server Components and `useI18n()`
from `src/lib/i18n/client.tsx` in Client Components. Wrap whole sentences with
`t("View {name}", { name })` so translations can reorder values. Add Vietnamese
translations for every new interface message. Dates use locale-specific formatting
in the app's Asia/Ho_Chi_Minh timezone.

Game names and labels use namespaced keys in `src/lib/i18n/game-en.json` and
`game-vi.json`. For example, `hero.sea-captain` and `fish.lemon-fish` reuse the
slugs already stored in the database; no schema migration or data rewrite is
needed. Call `gameLabel("hero", hero)` (or a source name when a projection has no
slug). Talents, awakenings, artifacts, cores, attributes, fishing areas,
collections, and bait have their own namespaces, so similarly named labels do
not collide. Both dictionaries must be updated when catalog labels change.
Vietnamese translations are app translations of the recorded English labels.

Hero and fish searches match both languages with or without Vietnamese accents.
Build-import search also matches translated hero names. User-written build and
lineup names, notes, and screenshot-transcribed description paragraphs retain
their source text. Database IDs, enum values, URLs, and portrait assets remain
stable. Run `pnpm test` for complete game-label coverage, bilingual search,
rendering, and the existing access-policy checks.
