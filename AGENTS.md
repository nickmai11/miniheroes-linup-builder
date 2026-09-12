<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project context

This repo is a lineup-sharing tool for the mobile game Mini Heroes: Magic Throne.
Read `docs/mini-heroes-magic-throne.md` before touching hero data, portraits, or
lineup logic, and `docs/hero-details-page.md` before adding or changing a hero's
detail page. Two hard rules from the owner: hero portraits come only from the
owner's screenshots in `gameplay/heroes/` (never from the internet), and
the portrait must show the whole card art panel with the artifact-progress diamond
removed. Regenerate portraits and seed data with `scripts/slice-hero-cards.py`.

Whenever the owner states anything about the game — mechanics, hero details,
formation, what a UI element means — record it immediately (same turn) in the
"Owner-stated facts" log in `docs/mini-heroes-magic-throne.md`, dated, and fold it into
the relevant section. The owner is the authority; web guides have been wrong.
