# Hero details page — requirements and how to add a hero

Route: `/heroes/[slug]` (`src/app/heroes/[slug]/page.tsx`). Reference hero:
**Sea Captain** (`/heroes/sea-captain`), the first one done end to end. Everything
below was established while building it; follow it for every other hero. Game
facts behind these rules are in `mini-heroes-magic-throne.md` (Owner-stated facts).

## 1. What the page shows

In this order, top to bottom of the right column (portrait + "Start a lineup"
button in the left column):

| Section        | Content                                                                                                                                                                                                                                          | Source of truth                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Header         | class badge + name, class label                                                                                                                                                                                                                  | `heroes` row (from Archive slices)                      |
| Notes          | free text, only if set                                                                                                                                                                                                                           | `heroes.notes`                                          |
| **Talents**    | six cards: icon, kind, unlock stars, name, description; under a card: its Artifact Bonus (tier diamond) and Core bonus (core gem)                                                                                                                | `hero_skills`, `hero_artifact_bonuses`, `hero_cores`    |
| **Artifacts**  | artifact image + name; one row per quality tier (purple, gold, red, rainbow) with the diamond, the talent it modifies or the artifact's own skill, and the description                                                                           | `heroes.artifactName/IconUrl`, `hero_artifact_bonuses`  |
| **Divinities** | the hero's mythic (red) divinities as equal-width badge cards, each linking to `/divinities/<slug>` (the heroes that share it)                                                                                                                   | `hero_divinities` → `divinities`                        |
| **Builds**     | the owner's builds for the hero: name, notes, chosen rune attributes grouped by rune type (with max value) and weapon attributes, each in pick order with a rank number (first picked = most important); editable in place (new / edit / delete) | `hero_builds`, `hero_build_runes`, `hero_build_weapons` |
| Lineups        | saved lineups that use the hero                                                                                                                                                                                                                  | `lineup_heroes`                                         |

Still to build: **Awakening skills** (I–IV; II and IV are shared per class, so store
those once per class). No screenshots yet.

Rules that shape the page:

- **No counts** anywhere ("6 talents", "30 divinities"). Empty states are fine.
- An artifact bonus **attached to a talent** appears under that talent _and_ in
  the Artifacts section. One **not attached** (the rainbow-tier artifact skill,
  e.g. Ship Raid) appears only under Artifacts.
- Only **mythic (red)** divinities are recorded — the two bottom badges of the
  Artifact tab. The purple/gold rows are ignored.
- Names follow the in-game text, minus UI suffixes: divinity = stat row without
  "All" and without "Divinity"; core = gear name without "·Core".
- The owner's in-game text wins over any web guide or compendium when they differ
  (Sea Captain's Undying numbers differ from MR-UK's card, for instance).
- Player-dependent numbers (level, ATK/DEF/HP, power, artifact stats, divinity
  levels) are never stored.

## 2. Screenshots needed per hero

Phone captures at 699×1260 (the Talent/Artifact tab layout is position-based, so
keep the same device/scale). Put them in:

| Folder                 | What                                                                                                                                  | Count |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `gameplay/heroes/`     | Archive grid (only if the hero is new to the roster)                                                                                  | —     |
| `gameplay/talents/`    | Talent tab with nothing open (optional, for reference)                                                                                | 1     |
| `gameplay/talents/`    | Talent tab with **each** talent's popup open — the popup must show the talent, and its Artifact Bonus and Core panels when they exist | 6     |
| `gameplay/talents/`    | Artifact tab (the weapon with the six divinity badges)                                                                                | 1     |
| `gameplay/talents/`    | Artifact popup (tap the weapon: name, stars, four tier abilities)                                                                     | 1     |
| `gameplay/divinities/` | A divinity popup for any **red** badge whose divinity is not yet in the catalog                                                       | 0+    |

From these you read: talent kind / name / description; unlock order; artifact
bonuses and their tier; core names and text; the artifact's name and rainbow-tier
skill; the two mythic divinities (left, right).

Unlock order is fixed: ultimate in the centre (available from the start), then the
ring **clockwise from the lower-left** at **2★, 5★, 8★, 12★, 16★**. Verify against
the screenshot positions; the compendium cards list the same order.

## 3. Files to touch

1. **Icons** — `scripts/slice-talent-icons.py`: add the hero to `LAYOUT`
   (popup file → talent name, plus the Artifact tab and artifact popup files) and
   run it. It writes `public/talents/<hero>/<skill-slug>.png` (round icon, chevron
   masked), `public/artifacts/<hero>.png`, and, once, the shared
   `public/icons/artifact-{purple,gold,red,rainbow}.png` and `public/icons/core.png`.
   All icons are trimmed to their opaque bounds so they render at one scale.
2. **New divinities** — only if a red badge is missing from `/divinities`: add the
   popup screenshot to `gameplay/divinities/`, a row to `CATALOG` in
   `scripts/slice-divinities.py`, run it, then run `scripts/upsert-divinities.sql`
   against Supabase (or let `ensureDivinitiesSeeded()` insert it on next read).
3. **Data** — `src/data/hero-details.ts`: add a `heroDetailSeeds["<slug>"]` entry:
   `artifact { name, iconUrl, bonuses[tier, skill | name, description] }`,
   `skills[kind, name, unlockStars, iconUrl, description]` in unlock order,
   `cores[name, skill, description]`, `divinities[left-slug, right-slug]`.
   `skill` strings must match a talent name exactly (that is how bonuses and cores
   link to talents).
4. **Doc** — `docs/mini-heroes-magic-throne.md`: log any new game fact the owner
   states in "Owner-stated facts", and add the hero's talent table under
   "Talents, artifact and cores" if it teaches something new.
5. **Cache** — if any image under `public/` was _replaced_ (not just added), bump
   `ASSET_VERSION` in `src/lib/asset-version.ts`.

No migration is needed for a new hero. The page calls `syncHeroDetail()` on view,
which upserts the seed (skills matched by name, cores / bonuses / divinities
replaced, artifact name and icon set). Open `/heroes/<slug>` once and the DB is
up to date; there is no separate seed command.

## 4. Data model (for reference)

- `heroes`: `+ artifactName`, `artifactIconUrl`.
- `hero_skills`: `kind` (ultimate | battle | special | attribute | enhance |
  passive), `name`, `description`, `unlockStars` (0 for the ultimate), `iconUrl`,
  `sortOrder`.
- `hero_artifact_bonuses`: `tier` (purple | gold | red | rainbow), `skillId`
  (null for rainbow), `name` (rainbow only), `description`, `sortOrder`.
- `hero_cores`: `skillId`, `name`, `description`, `sortOrder`.
- `hero_divinities`: `divinityId`, `position` (0 = bottom-left, 1 = bottom-right).
- `divinities`: `slug`, `name`, `kind`, `iconUrl` (catalog of mythic divinities).
- `hero_builds`: `name`, `notes`; `hero_build_runes` → `rune_attributes`,
  `hero_build_weapons` → `weapon_attributes`, both with `sortOrder` = pick order
  (priority). The only hero data edited in the app (the rest is seeded from files).
  Attributes are picked from the catalogs, never typed.

Schema changes need a Drizzle migration; append the RLS policy + grant for
`lineup_app` to any new table by hand and apply as described in the game doc
(the transaction pooler breaks `db:migrate`).

## 5. Checklist before calling a hero done

- [ ] Six talents, kinds match the in-game labels, stars 0/2/5/8/12/16 in clockwise order
- [ ] Every talent has an icon; no gold chevron or text fragments in it
- [ ] Artifact name, image, and four tier abilities; the first three link to talents
- [ ] Four cores, each linked to a talent
- [ ] Two mythic divinities, both present in the catalog with icons
- [ ] Descriptions copied from the owner's screenshot text, not from a guide
- [ ] `pnpm typecheck`, `pnpm lint`, page loads at `/heroes/<slug>` with all images 200
- [ ] Owner-stated facts logged the same turn they were said

## 6. Known gaps

- Awakening skills: not modelled or displayed.
- The rainbow-tier artifact skill has no icon (the game shows it as text only).
- Divinity growth values per level are not stored (only name, kind, icon).
- "Tank / DPS" position and "Eternal" quality tags are real in-game labels but are
  not stored yet.
