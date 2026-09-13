# Hero details page — requirements and how to add a hero

Route: `/heroes/[slug]` (`src/app/heroes/[slug]/page.tsx`). Reference hero:
**Sea Captain** (`/heroes/sea-captain`), the first one done end to end. Everything
below was established while building it; follow it for every other hero. Game
facts behind these rules are in `mini-heroes-magic-throne.md` (Owner-stated facts).

## 1. What the page shows

Hero listings (the hero pool, lineup picker, and divinity hero lists) show only
heroes with an entry in `heroDetailSeeds`. Partly recorded heroes remain visible;
adding a detail entry automatically makes a hero eligible for these lists.
Saved lineup slots and direct hero lookups retain the full roster.

Build names open a stats popover on hover or tap, using the same rune/weapon/core
layout and priority markers as the saved build. Core names and chips open a
popover showing the core's recorded bonus and linked talent (name, kind, unlock
stars, icon, and description). This applies to saved builds, the build editor,
and core bonuses beneath talents; use recorded `skillId` links, never name guesses.
The lineup editor can assign a hero one of its own saved builds and uses these
same previews without expanding the hero card.

Build popovers are up to 40rem wide, constrained to the viewport and available
space around their trigger. All info popovers use fixed positioning and reserve
scrollbar space inside the popup; the page also reserves its scrollbar gutter so
opening a preview does not shift the page or rewrap its contents.

In this order, top to bottom of the right column (portrait + "Start a lineup"
button in the left column):

| Section        | Content                                                                                                                                                                                                                                          | Source of truth                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Header         | class badge + name, class label                                                                                                                                                                                                                  | `heroes` row (from Archive slices)                      |
| Notes          | free text, only if set                                                                                                                                                                                                                           | `heroes.notes`                                          |
| **Talents**    | six cards: icon, kind, unlock stars, name, description; under a card: its Artifact Bonus (tier diamond) and Core bonus (core gem)                                                                                                                | `hero_skills`, `hero_artifact_bonuses`, `hero_cores`    |
| **Awakening skills** | I (18★) and III (22★): stage, unlock stars, skill name and description, without icons; an unrecorded stage has an empty state | `HERO_AWAKENING_STAGES` and `heroDetailSeeds[slug].awakeningSkills` in `src/data/hero-details.ts` |
| **Artifacts**  | artifact image + name; one row per quality tier (purple, gold, red, rainbow) with the diamond, the talent it modifies or the artifact's own skill, and the description                                                                           | `heroes.artifactName/IconUrl`, `hero_artifact_bonuses`  |
| **Divinities** | the hero's mythic (red) divinities as equal-width badge cards, each linking to `/divinities/<slug>` (the heroes that share it)                                                                                                                   | `hero_divinities` → `divinities`                        |
| **Builds**     | the owner's builds for the hero: name, notes, chosen rune attributes grouped by rune type, weapon attributes, and hero cores, all with Important / Should have / OK to have priority tiers; editable in place (new / edit / delete) | `hero_builds`, `hero_build_runes`, `hero_build_weapons`, `hero_build_cores` |
| Lineups        | saved lineups that use the hero                                                                                                                                                                                                                  | `lineup_heroes`                                         |

Awakening I and III are recorded for **Sea Captain**, **Nezha**, **Shadow Fiend**,
**Necromancer**, **Thrall**, **Jungle Envoy**, **Radiant Paladin**, **Silence**,
**Gunslinger**, **Dark Knight**, **Arcane Saint**, **Witch Dictator**, **Silver
Warrior**, and **Holy Healer**. The nine-hero 11.33–11.37 AM batch is complete;
Jungle Envoy's follow-ups provide Pulse Nova and its fourth core, and Witch
Dictator's 11.51.47 AM inner-panel scroll completes Dark Faded.
Necromancer's III preserves the screenshot's exact ending,
"lasts until the end". Its other awakening capture shows **Support IV: Emergency
Healing**, recorded once in the game reference. Class-wide II/IV are not displayed
yet and must not be copied into hero-specific I/III data.

The owner confirmed I unlocks at **18★** and III at **22★**. The shared thresholds
live in `HERO_AWAKENING_STAGES`; show them beside the stage, including empty states.

**Radiant Envoy** has six screenshot-backed talents, four cores, all four Wand
of Light artifact tiers, and two mythic divinities from the owner's
12.47.59–12.48.15 PM batch. The 12.48.06 PM scroll completes Mage Robe, and
12.48.15 PM completes the standalone rainbow **Lucent Singularity**. Preserve
Spell Tome's **27% (80%)** reduction to **Melee DMG Reduction** exactly.
Awakening I **Radiant Glow** and III **Holy Light Field** use the MR-UK excerpt
`gameplay/talents/image.png`, explicitly approved as their source by the owner
on 2026-09-13. Additional awakening screenshots are not required for this update.
The source remains identified as a guide. Its Mage common skills are documented
separately and are not part of this hero's awakening data.

Build imports use an outline button matching **New build**. The picker searches
hero and build names on the server, loads twelve results per page only when opened,
and keeps the results in a scrollable panel. Select a build, then choose **Import
build** to copy its name, notes, attribute priorities, and matching core priorities.
Searching or changing pages clears the selection; Cancel or Escape closes the picker.

Rune attributes, weapon attributes, and cores use three priority tiers:
**Important** (one red diamond),
**Should have** (gold diamond), and **OK to have** (blue dot and chip tint).
The label is exactly **Important**. A shared legend explains
the markers; accessible names and tooltips also spell out the tier. In the editor,
clicking a chip cycles through its available tiers and then removes it.
Chips keep a fixed icon slot for the unselected plus and all priority markers,
so toggling items does not change their widths or row wrapping. Saved selections
are grouped by tier within each rune type, Weapons, and Cores, preserving pick
order within a tier. The stored `must` value displays as **Should have**;
the former middle tier remains **OK to have**, which is also the default when no
priority is supplied.

Saved builds and build previews always show Runes (Attack, Effect, Energy, and
Survival), Weapons, and Cores. Empty groups show a muted placeholder instead of
disappearing. Build editor groups also show a placeholder if their catalog has
no available attributes or recorded cores.

The build editor has a **Reset** button for Runes, Weapons, Cores, and each rune
type. Reset clears only that group's selections and priority assignments in the
draft; changes take effect when the build is saved. Empty groups and groups being
saved have disabled Reset buttons.

Runes, Weapons, and Cores have bold headings on a subtle gold background with a
gold left border, in both saved builds and the editor. Build names are larger to
keep them distinct from these section headings and the smaller rune-type labels.
Sections have 1.5rem of vertical separation, with 1rem between rune-type groups.

Builds also include **Cores**, picked from this hero's recorded cores with the same
priority tiers as Weapons. Core descriptions appear on
hover. A build may contain only cores; heroes without recorded cores show an
empty state in the picker. Existing builds start with no selected cores.
Imports preserve every selected attribute's tier and match core gear names to the
destination hero's own core records and effects, preserving their tiers and order.
Unmatched names are reported after import; an
import with no usable attributes or cores is rejected.

Build creation, editing, importing, deletion, and the "Start a lineup" link are
available only in local development, as described in the README's Local editing
section. Public visitors can read saved builds and lineups; every build write
action also enforces this restriction on the server.

Rules that shape the page:

- **No counts** anywhere ("6 talents", "30 divinities"). Empty states are fine.
- An artifact bonus **attached to a talent** appears under that talent _and_ in
  the Artifacts section. One **not attached** (e.g. Ship Raid, gold-tier Frost
  Dark Axe / Full-out Shooting, or red-tier Withering Fear) appears only under
  Artifacts.
  Rainbow is not always standalone: Thrall's rainbow bonus modifies **Thunder
  Strike** and appears in both sections. Use the talent link, not the tier, to
  decide whether an ability is attached.
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
| `gameplay/talents/`    | Hero Awaken screen with I and III selected; show each skill's name and full description | 2 |
| `gameplay/divinities/` | A divinity popup for any **red** badge whose divinity is not yet in the catalog                                                       | 0+    |

From these you read: talent kind / name / description; unlock order; artifact
bonuses and their tier; core names and text; the artifact's name and rainbow-tier
skill; the two mythic divinities (left, right).

Awakening screenshots currently use 706×1255 captures. Each stage's named skill
is the final node above the description panel. Preserve the text even if the
player has not activated the skill; activation state is not hero data.

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
   If the artifact ability popup is missing, set `artifact_popup` to `None` to
   slice the supplied talents and artifact using the existing shared tier icons.
   Use a per-hero `artifact_box` when capture geometry differs; exclude stars and
   other player progress from the artifact crop. For diagonal art that extends
   outside the circular mask, set `artifact_corner_radius` (e.g. 24) to use a
   rounded rectangle that preserves the weapon's tips.
2. **New divinities** — only if a red badge is missing from `/divinities`: add the
   popup screenshot to `gameplay/divinities/`, a row to `CATALOG` in
   `scripts/slice-divinities.py`, run it, then run `scripts/upsert-divinities.sql`
   against Supabase (or let `ensureDivinitiesSeeded()` insert it on next read).
3. **Data** — `src/data/hero-details.ts`: add a `heroDetailSeeds["<slug>"]` entry:
   `artifact { name, iconUrl, bonuses[tier, skill | name, description] }`,
   `skills[kind, name, unlockStars, iconUrl, description]` in unlock order,
   `cores[name, skill, description]`, `divinities[left-slug, right-slug]`.
   Add `awakeningSkills[stage, name, description, sourceScreenshot]`
   for I and III. Preserve the source screenshot filename for verification.
   `skill` strings must match a talent name exactly (that is how bonuses and cores
   link to talents).
4. **Doc** — `docs/mini-heroes-magic-throne.md`: log any new game fact the owner
   states in "Owner-stated facts", and add the hero's talent table under
   "Talents, artifact and cores" if it teaches something new.
5. **Cache** — if any image under `public/` was _replaced_ (not just added), bump
   `ASSET_VERSION` in `src/lib/asset-version.ts`.

No migration is needed for a new hero. The page calls `syncHeroDetail()` on view,
which upserts the seed (skills and cores matched by name, bonuses / divinities
replaced, artifact name and icon set). Core IDs remain stable so saved build
selections survive page loads. Open `/heroes/<slug>` once and the DB is
up to date; there is no separate seed command.
The sync locks the target hero before reading its existing talents, so concurrent
first loads cannot create competing seed rows. Metadata and page rendering share
one `getHeroDetail()` call through request-scoped React caching.

The `heroes.detailSeedHash` fingerprint records the last successfully synced
talents, cores, artifact and divinities. Unchanged content skips synchronization
writes; editing a seed automatically refreshes that hero on the next load.
The fingerprint is checked again under the row lock and commits in the same
transaction as the content, so concurrent loads and failed updates remain safe.
Apply migration `0014` before running the app with this optimization. Catalog
inserts are shared once per server module lifetime and retry after failures;
lineups, builds and notes still read current database values on each request.

Awakening skills are read directly from the versioned hero data file by
`getHeroDetail()`. They do not require a database migration, synchronization
write, or an additional database query on page load.

## 4. Data model (for reference)

- `heroes`: `+ artifactName`, `artifactIconUrl`.
- `hero_skills`: `kind` (ultimate | battle | special | attribute | enhance |
  passive), `name`, `description`, `unlockStars` (0 for the ultimate), `iconUrl`,
  `sortOrder`.
- `HeroAwakeningSkill` in `src/data/hero-details.ts`: `stage` (I | III), `name`,
  `description`, `sourceScreenshot`. The optional `awakeningSkills`
  array is served as part of `HeroDetail`; unrecorded heroes get an empty array.
- `hero_artifact_bonuses`: `tier` (purple | gold | red | rainbow), `skillId`
  (null for standalone skills), `name` (standalone skills only), `description`,
  `sortOrder`. Rainbow bonuses can have a talent link, as Thrall's does.
- `hero_cores`: `skillId`, `name`, `description`, `sortOrder`.
- `hero_divinities`: `divinityId`, `position` (0 = bottom-left, 1 = bottom-right).
- `divinities`: `slug`, `name`, `kind`, `iconUrl` (catalog of mythic divinities).
- `hero_builds`: `name`, `notes`; `hero_build_runes` → `rune_attributes`,
  `hero_build_weapons` → `weapon_attributes`, both with `sortOrder` = pick order
  and `priority` = important | must | optional (the `build_priority` enum,
  shared by runes, weapons, and cores). The only
  hero data edited in the app (the rest is seeded from files).
  Attributes are picked from the catalogs, never typed.
- `hero_build_cores`: `buildId` → `hero_builds`, `coreId` → `hero_cores`,
  `sortOrder` = pick order, `priority` = the same tier enum. A core must belong to the build's hero; each core
  can appear once per build. Deleting a build or core cascades to its selections.

Schema changes need a Drizzle migration; append the RLS policy + grant for
`lineup_app` to any new table by hand and apply as described in the game doc
(the transaction pooler breaks `db:migrate`).

## 5. Checklist before calling a hero done

- [ ] Six talents, kinds match the in-game labels, stars 0/2/5/8/12/16 in clockwise order
- [ ] Every talent has an icon; no gold chevron or text fragments in it
- [ ] Awakening I and III have screenshot-verified names and descriptions; no icons
- [ ] Artifact name, image, and four tier abilities; link by the shown talent, not quality (any tier may be standalone)
- [ ] Four cores, each linked to a talent
- [ ] Two mythic divinities, both present in the catalog with icons
- [ ] Descriptions copied from the owner's screenshot text, not from a guide
- [ ] `pnpm typecheck`, `pnpm lint`, page loads at `/heroes/<slug>` with all images 200
- [ ] Owner-stated facts logged the same turn they were said

## 6. Known gaps

- Necromancer: Ghostlight Bone's rainbow skill **Exhaustion Aura** is partly
  hidden behind the artifact popup's Max Quality footer; its Energy Regen
  reduction value and any following text are not visible. All four cores are now
  recorded, including **Crystal Staff** for **Death Pulse** from the 9.31.17 AM
  capture (DMG and Heal +30% of Attack). Awakening I and the full Luminous Visor
  core are also recorded.
- Shadow Fiend: the full Soul Mask ability popup and rainbow ability are still
  missing. The follow-up `gameplay/talents/image copy.png` completes the red bonus
  and fourth core, **Crystal Pendant** for **Destructive Gloom** (6% DMG Reduction
  for 10s after each cast; 100% chance to purge all negative effects from self).
- Awakening II and IV: class-wide skills are not displayed yet; Support IV is
  recorded in the game reference. Mage Spell Barrier / Psychic Surge appear only
  in the unverified MR-UK excerpt and need in-game confirmation; the other
  class-wide skills remain unrecorded.
- The rainbow-tier artifact skill has no icon (the game shows it as text only).
- Divinity growth values per level are not stored (only name, kind, icon).
- "Tank / DPS" position and "Eternal" quality tags are real in-game labels but are
  not stored yet.
