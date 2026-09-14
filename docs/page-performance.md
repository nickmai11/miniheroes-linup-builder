# Page performance review — 2026-09-13

## Deployment follow-up — 2026-09-14

The deployed app's `/invite` response reported
`x-vercel-id: hkg1::iad1::…`: traffic entered through Hong Kong and the page
function executed in Washington, D.C. The configured database pooler is in
`ap-northeast-1` (Tokyo), matching the database location documented in README.
There was no repository-level function region configuration.

Added `vercel.json` with `regions: ["hnd1"]` to place server functions in Tokyo
with the database. Vercel documents this as an override of the project's function
region; it takes effect on a new deployment:
[region configuration](https://vercel.com/docs/functions/configuring-functions/region),
[region identifiers](https://vercel.com/docs/regions).

Before the change, four unauthenticated `/invite` GETs returned HTTP 200 with
time to first byte of 1.308, 3.108, 1.018 and 1.011 seconds. Total response times
were 1.333, 3.135, 1.044 and 1.014 seconds. A `/heroes` request redirected to the
invitation gate in 0.908 seconds. These client-observed timings include network,
proxy and rendering time; they do not isolate database or authentication latency.
The invitation page is only a baseline, not a signed-in API benchmark.

The region mismatch adds distance to each database round trip, but the exact
improvement remains unmeasured until deployment. Verify the new deployment's
response headers show `hnd1` and repeat timings for signed-in pages and APIs.
The proxy and server entry points also independently verify Supabase admin
sessions; this remains a potential contributor to signed-in request latency.

## Original query review

Hero listings, divinity hero listings and lineup pages synchronized every recorded
hero before returning content. Each synchronization rewrote talents, cores,
artifact bonuses and divinity links, even when the source data was unchanged.
These sequential database round trips delayed navigation. The app also had no
route loading fallback.

## Changes

- Store a fingerprint of each successfully synchronized hero seed in
  `heroes.detail_seed_hash`. Unchanged heroes perform no synchronization writes.
  Recheck under the existing row lock and commit the fingerprint with the content.
- Share catalog initialization across requests, retrying if initialization fails.
- Share metadata and page reads for individual lineups and divinities within a
  request. Mutable builds, notes and lineups retain fresh reads across requests.
- Add a loading fallback while routes stream. The September 14 skeleton review
  replaced the root fallback with page-specific leaf boundaries so home/list
  skeletons cannot precede detail skeletons; see `src/app/README.md`.

Migration `0014_hero_detail_seed_hash` adds the nullable fingerprint column. The
first visit after migration synchronizes existing heroes once; subsequent visits,
including visits after a server restart, can recognize unchanged content. Editing
persisted seed content refreshes the affected hero automatically. Awakening-only
edits do not require synchronization.

## Measurements

The before/after loader measurements used an isolated local PostgreSQL database
with the same 14 recorded hero seeds. Counts below are Drizzle-logged statements
for repeat loads after initialization, excluding transaction-control statements.

| Loader | Before: statements / writes | After: statements / writes |
| --- | ---: | ---: |
| Hero pool | 283 / 224 | 3 / 0 |
| Sea Captain detail | 27 / 16 | 6 / 0 |
| Knockback Effect hero list | 283 / 224 | 3 / 0 |
| Lineup list, empty test database | 282 / 224 | 2 / 0 |

A cold server still performs one hero-catalog insert attempt before its first
listing read. Populated lineup lists also read slots and their divinities.

A local production build using that isolated database returned HTTP 200 and the
expected content for heroes, hero details, divinities, divinity details, lineups
and About. Warm total HTML response times were 9–32 ms on the data pages; the
first hero-list request was 115 ms. These are server-response smoke checks, not
browser navigation, image-loading, Core Web Vitals or deployed-site measurements.
Shared-database loader profiling was not run because the old loaders mutate data.

## Verification

The full 85-test suite passed with the opt-in integration test enabled. It verifies
unchanged-page query counts, module reloads, awakening-only edits, changed talents,
concurrent synchronization, concurrent page reads, stable core/build references,
rollback and retry. Catalog initializer tests cover concurrent calls and failures.
TypeScript, ESLint and a production build with `next build --webpack` also passed.

The integration test only accepts a disposable localhost PostgreSQL instance on
port 55439 with user `perf`; migrate that instance before running:

```sh
HERO_SYNC_TEST_DATABASE_URL=postgres://perf@127.0.0.1:55439/postgres \
  node --experimental-strip-types --test tests/*.test.mjs
```

Ordinary `pnpm test` runs skip the database integration case. The test never
falls back to the application's `DATABASE_URL`.
