# Mini Heroes: Magic Throne — game reference

This repo is a lineup-building knowledge base for the mobile game **Mini Heroes: Magic
Throne**. This page records what the game is and how the app models it, so anyone
(human or agent) can pick the project up without re-researching.

The owner is a veteran player. Facts marked **(game)** come straight from their
in-game screenshots and are authoritative. Facts marked **(web)** come from public
guides and may be dated or wrong; prefer the owner's word over them.

## The game

- **Title:** Mini Heroes: Magic Throne. Earlier store name: _Mini Heroes: Mars' Squad_.
- **Developer:** MAX GAME PTE. LTD. Android package `com.and.brawl.en`; iOS id `6478139184`.
- **Genre:** idle / AFK gacha RPG with auto-battles. You don't control fights; you
  build the team, level and gear heroes, and let combat play out.
- **Story:** Prince Mars reclaims the throne of Valoria from a dark sorcerer. (web)

### Heroes (game)

Every hero has exactly one **role** and one **rarity**. Both are visible on the card in
the in-game **Archive** screen:

| Role     | Badge on card (top-right) | Job in a lineup                 |
| -------- | ------------------------- | ------------------------------- |
| Warrior  | orange, sword icon        | frontline / tank / melee damage |
| Marksman | green, bow icon           | single-target ranged damage     |
| Mage     | blue, staff icon          | area / magic damage             |
| Support  | purple, shield-cross icon | healing, buffs, debuffs, energy |

| Rarity | Card background | Count |
| ------ | --------------- | ----- |
| Mythic | red             | 40    |
| Legend | gold            | 14    |
| Epic   | purple          | 11    |

The small **diamond in the bottom-left of a card is artifact progress**, not part of
the hero art. It is removed from the portraits in this app.

Roster as of 2026-09-12 (65 heroes) — see the table at the end of this file. The
seed data lives in `src/data/heroes.ts`.

### Hero details (owner-defined, 2026-09-12)

The hero detail page must show exactly these things about a hero:

1. **Name**
2. **Class** (Warrior / Marksman / Mage / Support)
3. **Portrait** (owner screenshot only, see Portrait pipeline)
4. **Divinities**
5. **Talents**
6. **Awakening skills**
7. **Cores**

Rule (game): a hero has four awakening skills, I–IV. **Awakening skills II and IV
are identical for every hero of the same class**; only I and III are hero-specific.
The app should store the class-wide II/IV once per class, not per hero.

Not part of the hero page: Level / ATK / HP / DEF / power (they depend on the
player's investment), skins, and the fan "Tank / DPS" label.

Open questions for the owner: what "divinities" and "cores" look like in-game and
how they map to the compendium's "Divine Weapon" panel (a named weapon ringed by six
unlabelled stat icons), and whether "talents" means the six skill tiles below.

### Divinities (game, 2026-09-12)

Each hero's **divine weapon** screen shows a named weapon ringed by six round
badges. Each badge is a **divinity**: a single stat that is levelled with divinity
gems (red gem icon) plus gold; the popup shows the level, the stat, and Enhance /
Reset buttons. Level 150 has been seen with no further upgrade arrow. The same
divinity appears on many heroes' weapons. The screen also shows an
**Ascension Bonus** line "Artifact and Divinity ATK/DEF/HP: 5%/5%/5%".

The popup is titled "<Kind> Divinity" and the stat row starts with "All" for
account-wide stats or a class name for class-specific ones. **Naming rule
(owner):** the app names a divinity by its stat row without "All" and never with
the "Divinity" suffix. So "DMG Reduction Divinity" whose row reads
"All DMG Reduction" is **DMG Reduction**, and the same-titled popup whose row reads
"All Physical RES" is **Physical RES**. The popup title (minus "Divinity") is kept
as `kind`.

30 divinities read from the owner's popups (`gameplay/divinities/`, 131 shots with
duplicates; produced by `scripts/slice-divinities.py`):

| Kind          | Divinities (stat rows)                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| ATK           | ATK, Mage ATK, Support ATK, Warrior ATK (flat numbers)                                                      |
| DEF           | DEF, Marksman DEF (flat)                                                                                    |
| HP            | HP (flat)                                                                                                   |
| DMG Increase  | DMG Increase, Physical DMG Boost, Magic DMG Boost, Melee DMG Boost, Ranged DMG Boost (%)                    |
| DMG Reduction | DMG Reduction, Physical RES, Magic RES, Melee DMG Reduction*, Ranged DMG Reduction (%)                      |
| CRIT          | CRIT Rate, CRIT Damage (%)                                                                                  |
| RES           | Anti-Control Rate, Control RES, SPD Reduction RES, CRIT DMG Reduction, Anti-CRIT Rate, Knockback Resist (%) |
| Knockback     | Knockback Effect (%)                                                                                        |
| Weakness      | Heavy Injury (%)                                                                                            |
| SPD Boost     | ATK SPD (%)                                                                                                 |
| Cleansing     | Healing Effect, Receive Healing (%)                                                                         |

\* The in-game row is truncated to "All Melee DMG Reduct"; expanded to match
"Ranged DMG Reduction".

Marksman ATK, Warrior/Mage/Support DEF and per-class HP have not been seen in the
screenshots yet; add them to CATALOG in the script when they turn up. Which six
divinities each hero has is not recorded yet (the popups don't show the hero).

#### Third-party reference: MR-UK hero compendium (web, unverified)

The official Discord server (guild `1214861046125166603`) has a forum channel
`📚｜hero-compendium` (`1528702745714888796`) where the user **MR-UK**
(`hunter.no1`) posts one infographic per hero. 14 posted between 2026-07-20 and
2026-08-28: Shadow Fiend, Silence, Dark Knight, Foxy Spirit, Thrall, Gunslinger,
Necromancer, Nezha, Sea Captain, Arcane Saint, Swordevil, Templar, Darkin Hunter,
Radiant Paladin. Each card shows:

- Basic info: class, rarity, Lv. 100 base ATK / HP / DEF, a "Talent Bonus" label
  (e.g. Damage Reduction, Damage Increase) and sometimes a "Talent Effects" line.
- A "Mythic · Tank" / "Mythic · DPS" position tag (fan label, not confirmed in-game).
- **Heavenly Talent Skills**: six tiles in fixed order with unlock thresholds
  Unlock / 2 Star / 5 Star / 8 Star / 12 Star / 16 Star. Each has a name, a type
  (Ultimate Skill, Battle Skill, Special Skill, Enhance, Attribute, Passive) and a
  description. Same six slots as the in-game hero card.
- **Awakening Skills**: four, I–IV, each with a name, description and either an
  unlock cost in two currencies (e.g. 360 / 60 for I) or "Lv. N Unlock".
- **Divine Weapon**: a named item (Sacred Book, sword, cloak) ringed by six icons.
- **Skin Showcase**: two skins with a bonus effect (HP / ATK / DEF).

These cards are fan-made and may lag game updates. Use them to pre-fill data, but
the owner's screenshots and statements override them.

### Lineups (game)

A battle lineup is **5 heroes**. Conventional wisdom (web) is one of each role plus a
flex pick, but the whole point of this app is to record the owner's better answers.

There is **no "Front 1 / Front 2 / Back" slot naming** in the game (owner, 2026-09-12).
The app labels slots plainly _Slot 1–5_ until the owner describes the real formation.

### Progression systems (web, unverified)

- Levelling with Hero XP; gear slots unlock at levels 10 / 20 / 40 / 60.
- Ascension with hero fragments unlocks skills and passives. Hero quality can be
  raised without fodder heroes; lineup swaps are free.
- Later layers: runes, glyphs, artifacts (the card diamond tracks artifact progress).
- Account-wide boosts: Lobby upgrades and the Statue (per-role bonuses).
- Currencies: Diamonds (premium), Gold, Hero XP, Recruit Scrolls. Heroes are
  recruited through a gacha "Recruit" menu; 30 guaranteed summons per day.

### Modes (web, unverified)

Story campaign, Tower of the Throne, Land of Trials, 1v1 Arena, guild-vs-guild
("tribal warfare"), fishing in Valoria (adds power), AFK rewards with auto-loot,
daily/weekly missions, limited events, redemption codes.

## Owner-stated facts (log)

Everything the owner says about the game gets appended here, dated, the moment it
is said. These override anything marked (web).

- 2026-09-12 — The owner is a veteran player and wants to share lineup-building knowledge; that is the purpose of this app.
- 2026-09-12 — Hero portraits must come only from the owner's own screenshots, never from the internet.
- 2026-09-12 — A hero portrait must show the whole card art panel (e.g. a mythic hero shows everything inside the red background), not a square crop.
- 2026-09-12 — The diamond in the bottom-left of an Archive card (purple / yellow / blue / red) is **artifact progress**. It must not be displayed in portraits.
- 2026-09-12 — There are exactly **four hero classes**: Warrior, Marksman, Mage, Support. There is no "unassigned" class. The in-game class badge (circle at the card's top-right) is shown next to every hero name in the app instead of a text label; rarity is not shown as text.
- 2026-09-12 — The hero pool is read-only: no add/edit/upload of heroes in the app. Roster changes go through the screenshots + `scripts/slice-hero-cards.py`.
- 2026-09-12 — There is nothing like "Front 1 / Front 2" in the game. Lineup slots must not be labelled front/back; use plain Slot 1–5 until the owner explains the formation.
- 2026-09-12 — Roles and rarities in the app were read from the owner's Archive screenshots: badge = role, card colour = rarity (red mythic, gold legend, purple epic). 65 heroes at this date.
- 2026-09-12 — A hero's detail page needs exactly: **name, class, portrait, divinities, talents, awakening skills, cores**.
- 2026-09-12 — A hero has awakening skills I–IV. **Awakening skills II and IV are the same for all heroes of the same class**; I and III are per hero.
- 2026-09-12 — The owner pointed at MR-UK's hero compendium posts on the official Discord (`📚｜hero-compendium` forum) as the reference for what a hero's info looks like.
- 2026-09-12 — Divinity screenshots live in `gameplay/divinities/` (with duplicates). Divinities go in the DB with their icon and what they do. Name = the stat without "All" and without "Divinity", e.g. **DMG Reduction** (not "DMG Reduction Divinity", not "All DMG Reduction").

## How the app models it

- `heroes` table: `slug`, `name`, `role` (warrior | marksman | mage | support),
  `rarity` (mythic | legend | epic), `imageUrl`, `notes`.
- `divinities` table: `slug`, `name` (stat without "All"), `kind` (popup title without
  "Divinity"), `iconUrl` (`/divinities/<slug>.png`). Seeded from `src/data/divinities.ts`
  by `ensureDivinitiesSeeded()` in `src/lib/divinities.ts`; no hero link yet.
- `hero_skills` table: `heroId`, `kind` (ultimate | battle | special | attribute |
  enhance), `name`, `description`, `sortOrder` — the six skill slots of the in-game card.
- `/heroes/[slug]` — hero detail: large portrait, badge + name, class, notes, skills
  (empty until recorded), and every saved lineup the hero appears in. "Start a lineup
  with X" opens the builder with that hero pre-placed in slot 1.
- `lineups` + `lineup_heroes`: a named lineup with a free-text write-up and up to 5
  `(position, hero)` rows, position 0–4. Deleting a hero or lineup cascades.
- `/divinities` — read-only list of all divinities, grouped by kind, icon + name.
- `/heroes` — the pool: read-only portrait grid with search and class filter. Each
  hero is shown as `{class badge} {name}`; badges live in `public/badges/<role>.png`.
- `/lineups/new` — click heroes into slots, add name + notes, save.
- `/lineups`, `/lineups/[id]` — browse and view saved lineups.
- Database: Postgres on Supabase, project `kautapzssaoeanylhfoo` (ap-northeast-1),
  accessed directly through Drizzle + postgres.js as the least-privilege role
  `lineup_app`. RLS is enabled on every table with an allow-all policy for that role
  only, so nothing leaks through the Supabase REST API.
- Migrations: `pnpm db:generate` then `pnpm db:migrate`. RLS + the `lineup_app`
  policy/grant are not tracked by Drizzle, so append them to each new migration file
  by hand (see `drizzle/0003_cooing_the_twelve.sql`). On 2026-09-12 `db:migrate`
  through the transaction pooler (port 6543) failed with "relation does not exist"
  even though the SQL was valid; 0003 was applied by running its statements in one
  transaction with `postgres` and inserting the row into
  `drizzle.__drizzle_migrations` (hash = sha256 of the file, created_at = journal
  `when`). If it happens again, do the same or migrate over the direct 5432 URL.

### UI theme

shadcn/ui components (`src/components/ui/`, base-nova style) themed in
`src/app/globals.css`: gold primary, warm parchment light mode, deep navy dark mode,
0.75rem radius, slightly enlarged type scale. Light/dark follows the system and can
be toggled in the header (`next-themes`, class strategy). Add components with
`pnpm dlx shadcn@latest add <name>`.

## Portrait pipeline

Portraits are **only** sliced from the owner's screenshots in
`game-play-screenshots/heroes/` (Archive screen, 3 cards per row). Do not source hero
images from the internet — the owner rejected that.

`scripts/slice-hero-cards.py` does the whole job:

1. Finds each card by the flat grey gutters around it.
2. Trims to the coloured art panel by the rarity's background colour (so white-haired
   or full-width characters aren't clipped). Result ≈ 188×231 px, keeps the role badge.
3. Paints over the artifact diamond with a mirrored patch of the same card's
   background, feather-blended.
4. Writes `public/heroes/<slug>.png` and regenerates `src/data/heroes.ts` from the
   per-screenshot layout table inside the script.

If a screenshot is added or a card moves, edit the `LAYOUT` table in the script (names
in reading order, roles, rarity per screenshot) and rerun it. Then run the upsert in
`scripts/upsert-heroes.sql` (or `pnpm db:push`/Drizzle) so Supabase matches.

Because portrait files are replaced in place, the URL carries a cache-busting
`?v=N` from `src/lib/portrait-version.ts`. Bump `PORTRAIT_VERSION` after re-slicing;
`next.config.ts` allows exactly that query string for `/heroes/**`.

The portrait tile keeps the card's 81:100 aspect ratio so the whole panel shows.

### Divinity icon pipeline

`scripts/slice-divinities.py` reads every popup screenshot in `gameplay/divinities/`,
finds the badge by the red title bar and the blue circle, groups duplicates by badge

- title + stat text, and matches each group to its hard-coded `CATALOG`
  (representative screenshot → name, kind). It writes `public/divinities/<slug>.png`
  (badge with transparent background, ~98 px), `src/data/divinities.ts` and
  `scripts/upsert-divinities.sql`. Unmatched screenshots are listed and fail the run:
  add a CATALOG row for each and rerun. Screenshots that are not popups (e.g. the
  divine weapon screen itself) are ignored.

## Roster

<!-- ROSTER:START -->

| Hero                 | Role     | Rarity | Slug                   |
| -------------------- | -------- | ------ | ---------------------- |
| Baphomet             | Warrior  | Mythic | `baphomet`             |
| Dark Knight          | Warrior  | Mythic | `dark-knight`          |
| Earthbreaker         | Warrior  | Mythic | `earthbreaker`         |
| Lucifer              | Warrior  | Mythic | `lucifer`              |
| Monkey King          | Warrior  | Mythic | `monkey-king`          |
| Nezha                | Warrior  | Mythic | `nezha`                |
| Sea Captain          | Warrior  | Mythic | `sea-captain`          |
| Silver Warrior       | Warrior  | Mythic | `silver-warrior`       |
| Swordevil            | Warrior  | Mythic | `swordevil`            |
| Swordmaster          | Warrior  | Mythic | `swordmaster`          |
| White Ox             | Warrior  | Mythic | `white-ox`             |
| Wine Immortal        | Warrior  | Mythic | `wine-immortal`        |
| Ironblade Mixed-Race | Warrior  | Legend | `ironblade-mixed-race` |
| Masked Ninja         | Warrior  | Legend | `masked-ninja`         |
| Skeleton King        | Warrior  | Legend | `skeleton-king`        |
| Soul Doll            | Warrior  | Legend | `soul-doll`            |
| Whaley Imp           | Warrior  | Legend | `whaley-imp`           |
| Whirlpool Ninja      | Warrior  | Legend | `whirlpool-ninja`      |
| GooGoo Fish          | Warrior  | Epic   | `googoo-fish`          |
| Mars                 | Warrior  | Epic   | `mars`                 |
| Roar Warrior         | Warrior  | Epic   | `roar-warrior`         |
| Bone Archer          | Marksman | Mythic | `bone-archer`          |
| Captain Pilot        | Marksman | Mythic | `captain-pilot`        |
| Darkin Hunter        | Marksman | Mythic | `darkin-hunter`        |
| Gunslinger           | Marksman | Mythic | `gunslinger`           |
| Li Bai               | Marksman | Mythic | `li-bai`               |
| Medusa               | Marksman | Mythic | `medusa`               |
| Shadow Fiend         | Marksman | Mythic | `shadow-fiend`         |
| Shadow Master        | Marksman | Mythic | `shadow-master`        |
| Templar              | Marksman | Mythic | `templar`              |
| Cowboy Killer        | Marksman | Legend | `cowboy-killer`        |
| Hidden Ninja         | Marksman | Legend | `hidden-ninja`         |
| Moon Goddess         | Marksman | Legend | `moon-goddess`         |
| Jungle Archer        | Marksman | Epic   | `jungle-archer`        |
| Loli                 | Marksman | Epic   | `loli`                 |
| Snow Hunter          | Marksman | Epic   | `snow-hunter`          |
| Abyssal Queen        | Mage     | Mythic | `abyssal-queen`        |
| Foxy Spirit          | Mage     | Mythic | `foxy-spirit`          |
| Hela                 | Mage     | Mythic | `hela`                 |
| Iron Fan Princess    | Mage     | Mythic | `iron-fan-princess`    |
| Jungle Envoy         | Mage     | Mythic | `jungle-envoy`         |
| Observer             | Mage     | Mythic | `observer`             |
| Radiant Envoy        | Mage     | Mythic | `radiant-envoy`        |
| Two-Headed Dragon    | Mage     | Mythic | `two-headed-dragon`    |
| Witch Dictator       | Mage     | Mythic | `witch-dictator`       |
| Otherworld Prisoner  | Mage     | Legend | `otherworld-prisoner`  |
| Red Hood             | Mage     | Legend | `red-hood`             |
| Bamboo Hat           | Mage     | Epic   | `bamboo-hat`           |
| Fire Sorceress       | Mage     | Epic   | `fire-sorceress`       |
| Little Goblin        | Mage     | Epic   | `little-goblin`        |
| Arcane Saint         | Support  | Mythic | `arcane-saint`         |
| Dark Shaman          | Support  | Mythic | `dark-shaman`          |
| Holy Healer          | Support  | Mythic | `holy-healer`          |
| Lady Pan             | Support  | Mythic | `lady-pan`             |
| Necromancer          | Support  | Mythic | `necromancer`          |
| Radiant Paladin      | Support  | Mythic | `radiant-paladin`      |
| Silence              | Support  | Mythic | `silence`              |
| Snowoman             | Support  | Mythic | `snowoman`             |
| Thrall               | Support  | Mythic | `thrall`               |
| Warlock              | Support  | Mythic | `warlock`              |
| Diva                 | Support  | Legend | `diva`                 |
| Little Deer          | Support  | Legend | `little-deer`          |
| Mermaid Princess     | Support  | Legend | `mermaid-princess`     |
| Radiant Angel        | Support  | Epic   | `radiant-angel`        |
| Wizard               | Support  | Epic   | `wizard`               |

<!-- ROSTER:END -->
