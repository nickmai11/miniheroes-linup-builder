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

### Lineups (game)

A battle lineup is **5 heroes**. Conventional wisdom (web) is one of each role plus a
flex pick, but the whole point of this app is to record the owner's better answers.

The app labels slots _Front 1, Front 2, Back 1, Back 2, Back 3_. That is an
assumption about the formation grid; the owner has not confirmed the real layout.

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
- 2026-09-12 — Roles and rarities in the app were read from the owner's Archive screenshots: badge = role, card colour = rarity (red mythic, gold legend, purple epic). 65 heroes at this date.

## How the app models it

- `heroes` table: `slug`, `name`, `role` (warrior | marksman | mage | support),
  `rarity` (mythic | legend | epic), `imageUrl`, `notes`.
- `lineups` + `lineup_heroes`: a named lineup with a free-text write-up and up to 5
  `(position, hero)` rows, position 0–4. Deleting a hero or lineup cascades.
- `/heroes` — the pool: read-only portrait grid with search and class filter. Each
  hero is shown as `{class badge} {name}`; badges live in `public/badges/<role>.png`.
- `/lineups/new` — click heroes into slots, add name + notes, save.
- `/lineups`, `/lineups/[id]` — browse and view saved lineups.
- Database: Postgres on Supabase, project `kautapzssaoeanylhfoo` (ap-northeast-1),
  accessed directly through Drizzle + postgres.js as the least-privilege role
  `lineup_app`. RLS is enabled on every table with an allow-all policy for that role
  only, so nothing leaks through the Supabase REST API.

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
