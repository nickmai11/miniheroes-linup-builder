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

How to build a hero's page (screenshots, scripts, data, checklist) is in
`docs/hero-details-page.md`. The page must show exactly these things about a hero:

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

Owner requirement (2026-09-13): hero pages must include the hero-specific
**Awakening I and III**, transcribed from `gameplay/talents/` screenshots.
Awakening skills are text-only; the owner does not want icons for them.
The owner confirmed the unlock thresholds: **Awakening I at 18★** and
**Awakening III at 22★**. Show these alongside the stage labels.

Not part of the hero page: Level / ATK / HP / DEF / power (they depend on the
player's investment), skins, and the fan "Tank / DPS" label.

Where each lives in the game (owner screenshots, 2026-09-12): **talents** = the
Talent tab (six skills); **cores** = the four `<Gear>·Core` bonuses shown under a
talent; **divinities** = the six badges around the artifact on the Artifact tab
(only the two red / mythic ones are recorded). **Awakening skills** appear on the
Hero Awaken screen; I and III for Sea Captain and Nezha were supplied in
`gameplay/talents/` on 2026-09-13.

### Talents, artifact and cores (game, 2026-09-12)

**Talent tab.** Six talents: the **Ultimate Skill** in the centre and five in a
ring. Kinds seen: Ultimate Skill, Special Skill, Battle Skill, Enhance, Passive.
Each talent has a name and description; a progress bar ("Max" / "Currently full")
tracks talent levels. Tapping a talent opens up to three panels:

1. the talent itself (kind + description),
2. **Artifact Bonus** — an extra effect on that talent, colour-coded by the
   artifact quality that unlocks it (purple, gold, red diamond),
3. **`<Gear>·Core`** — a core bonus that further modifies the talent, e.g.
   "Cavalier Helm·Core: 「Water Blade」 additionally inflicts True DMG equal to
   18%(54%) of Attack". The four cores are Helm, Armor, Boots and the weapon
   (Blade of Valor for Sea Captain). The app stores the core name without the
   "·Core" suffix.

**Artifact tab.** The hero's divine weapon: a named artifact with stars and
ATK/DEF/HP (player-dependent, not stored), an "Ascension Bonus" line, and the six
divinity badges around it. The artifact popup lists one ability per quality tier:
purple / gold / red are the three talents' Artifact Bonuses, and a fourth
rainbow tier adds a new skill (Sea Captain: **Ship Raid**). The app stores all four
in `hero_artifact_bonuses`; the rainbow one has no talent.

**Sea Captain** (Warrior · DPS · Eternal; artifact Siren Blade):

| Talent         | Kind           | Artifact Bonus                                    | Core                                            |
| -------------- | -------------- | ------------------------------------------------- | ----------------------------------------------- |
| Ghost Ship     | Ultimate Skill | red: converts 75% of damage dealt into self HP    | Blade of Valor: +360% of Attack as Physical DMG |
| Torrent        | Special Skill  | gold: on hit −20% DEF, −25% MOV SPD for 5s        | Brawler's Armor: drains 120 Energy              |
| Rogue Waves    | Enhance        | —                                                 | —                                               |
| Steadfast Body | Passive        | —                                                 | —                                               |
| Water Blade    | Battle Skill   | purple: more damage the farther the enemy, ×4 cap | Cavalier Helm: True DMG = 18%(54%) of Attack    |
| Undying        | Enhance        | —                                                 | Brawler's Boots: enemy final DMG −15%           |
| Ship Raid      | Artifact       | rainbow tier ability of Siren Blade               | —                                               |

Unlock order (clockwise from lower-left): Water Blade 2★, Rogue Waves 5★, Torrent 8★,
Steadfast Body 12★, Undying 16★; Ghost Ship (ultimate) is available from the start.
Siren Blade's rainbow-tier skill **Ship Raid** is not attached to any talent.
Full descriptions are in `src/data/hero-details.ts`.

**Nezha** (Warrior · DPS · Eternal; artifact Fire-Tipped Spear, 4★ — the divine
weapon shares its name with the Battle Skill talent):

| Talent               | Kind           | Artifact Bonus                              | Core                                                 |
| -------------------- | -------------- | ------------------------------------------- | ---------------------------------------------------- |
| Wind Fire Wheels     | Ultimate Skill | red: releases 2 wheels per cast             | Blade of Valor: +35%(105%) Physical DMG from attacks |
| Fire-Tipped Spear    | Battle Skill   | purple: trigger chance +10%                 | Cavalier Helm: True DMG chance +6%(18%)              |
| Windfire             | Enhance        | —                                           | Brawler's Armor: +2.5%(7.5%) Magic RES per stack     |
| Armillary Sash       | Special Skill  | gold: +15% DEF for 4 s after each cast      | Brawler's Boots: enemy Energy Regen −10%(30%) more   |
| Threefold Arms       | Passive        | —                                           | —                                                    |
| Scorching Ember      | Enhance        | —                                           | —                                                    |
| Immortal Divine Body | Artifact       | rainbow tier ability of Fire-Tipped Spear   | —                                                    |

Unlock order (clockwise from lower-left): Fire-Tipped Spear 2★, Windfire 5★,
Armillary Sash 8★, Threefold Arms 12★, Scorching Ember 16★; Wind Fire Wheels
(ultimate) from the start. The rainbow-tier skill **Immortal Divine Body** (a
once-per-battle revive) is not attached to any talent. Full descriptions are in
`src/data/hero-details.ts`.

### Awakening skills (game, 2026-09-13)

Hero-specific I and III are read from the Hero Awaken screenshots in
`gameplay/talents/`. The named skill is the final node, with its description in
the panel below. The player's Activated/Inactivated state, currency inventory,
and padlock overlays are not part of the recorded hero skill.

| Hero | Stage | Skill | Effect | Screenshot (2026-09-13 AM) |
| ---- | ----- | ----- | ------ | ------------------------- |
| Sea Captain | I | Commander | At the start of battle, increases all allies' DEF by 15%; the effect disappears upon own death. | 8.42.24 |
| Sea Captain | III | Assault | Reduces the cooldown time of Torrent and Ship Raid by 25%. | 8.42.25 |
| Nezha | I | Samadhi Flame | Attacks deal bonus damage equal to 3% of the enemy's Max HP, capped at 150% of Nezha's Attack. | 8.42.32 |
| Nezha | III | Lotus Ward | For every 10% max HP lost, increases own energy recovery upon taking damage by 10%. | 8.42.37 |

Awakening I unlocks at **18★** and III at **22★** (owner-confirmed).
Only I and III have been screenshotted. II and IV remain class-wide skills and
must not be copied into each hero's data when recorded later.

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

Divinities have rarities; the app only includes **mythic (red)** ones (owner). The
30 mythic divinities read from the owner's popups (`gameplay/divinities/`, 131 shots with
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
- 2026-09-12 — Per-hero divinity slots are **not** to be recorded for now (work started from ELLA's Discord charts was aborted and reverted).
- 2026-09-12 — Divinities have rarities. Only the **mythic (red)** divinities need to be included in the app.
- 2026-09-12 — Talent screenshots live in `gameplay/talents/` (Sea Captain first). The hero screen has tabs **Attribute / Talent / Rune / Artifact**; the header shows the hero's stars and three tags, e.g. **Warrior · DPS · Eternal** — so "DPS" (position) and "Eternal" (quality) are real in-game labels. Game version 1.25.12.
- 2026-09-12 — **Talents** are the six skills on the Talent tab: the Ultimate Skill in the centre and five around it (Special Skill, Battle Skill, Enhance ×2, Passive). Each has a name, a kind and a description; some also show an **Artifact Bonus** (unlocked by artifact quality: purple / gold / red diamond) and a **Core** bonus (`<Gear>·Core`, e.g. "Cavalier Helm·Core") that modifies that talent.
- 2026-09-12 — **Cores** (owner's "cores") are the four `<Gear>·Core` bonuses: Helm, Armor, Boots and Blade (weapon) for a warrior. Each names the talent it enhances.
- 2026-09-12 — The **Artifact** tab is the divine weapon: a named artifact (Sea Captain: **Siren Blade**, 5★) with ATK/DEF/HP, one ability per artifact quality tier (purple / gold / red = the talents' Artifact Bonuses, rainbow = a fourth, new ability), ringed by the six divinities. Only the two **red** divinities (bottom row) are mythic.
- 2026-09-12 — Sea Captain's mythic divinities (from the owner's Artifact screenshot): **Warrior ATK** (left) and **ATK** (right).
- 2026-09-12 — The five ring talents unlock by **star progress: 2★, 5★, 8★, 12★, 16★, going clockwise** around the ring (the Ultimate in the centre is available from the start).
- 2026-09-12 — Each talent's **icon image** must be shown in the app (cut from the owner's talent screenshots).
- 2026-09-12 — The hero page gets a separate **Artifacts** section. An artifact bonus that is attached to a talent is listed in both the Talents and the Artifacts sections; one that is not attached to any talent (e.g. Sea Captain's rainbow-tier "Ship Raid") is listed only under Artifacts, never under Talents.
- 2026-09-12 — **Runes** come in four types: **Attack, Effect, Energy, Survival**. The owner's sheets in `gameplay/runes/Runes - <Type> Runes.csv` list every attribute a rune of that type can roll, its **max value** (a percentage, or flat energy points for Energy runes), the in-game description and the owner's analysis. Each sheet also has a per-role priority table (required / optional / not needed), but that is colour-coded and the colours are lost in the CSV export, so it is not imported yet. Attribute count: 10 attack, 11 effect, 8 energy, 10 survival.
- 2026-09-12 — **Weapon attributes.** A weapon's screen (Lv. 50 items seen) has **Base Attributes** (e.g. Support ATK + HP, or DEF + Support HP) and three **Random Additional Attributes**; the (!) next to "Additional Attributes" opens a **Possible Attributes** popup listing the pool that weapon can roll from. Screenshots of those popups live in `gameplay/weapons/` (many are duplicates of the same popup). Across all of them there are **24 distinct attributes**; names are the popup's abbreviations, e.g. "Melee DMG Reduct", "Heavy Injury Effect", "CRIT DMG RES" (some look like divinity names, but weapons are a separate system — see 2026-09-13). Pools differ per weapon (11–14 attributes each) but the popup does not name the weapon, so per-weapon pools are not recorded.
- 2026-09-12 — The hero details page gets a **Builds** section. A **build** is a hand-picked set of **rune attributes** and **weapon attributes** for that hero, chosen by the owner from the two catalogs (no automatic suggestions). A hero can have several builds.
- 2026-09-12 — The rune sheet's **"Severe Wound (Anti-Heal)"** is the game's **Heavy Injury Effect** (the same stat as the weapon attribute and the Heavy Injury divinity). The app uses the in-game name.
- 2026-09-13 — More rune sheet → in-game names: **"Healing Done"** is **Heal**, **"Received Healing"** is **Receive Healing** (same as the weapon attribute / divinity), **"Control Avoidance Chance"** is **Anti-Control**.
- 2026-09-13 — **Energy Rune popups** (owner screenshots, `gameplay/runes/energy-rune-popup-*.png`): a rune popup shows the rune type ("Energy Rune"), its quality (**Eternal**), an **Embedded** tag, a **Score**, and **five attribute lines**, each with a grade letter (**S / A / B / C**) and a value (e.g. "ATK Energy Regen +9.7"). The same attribute can appear on two lines of one rune. Buttons: Remove, Swap, and sometimes Refine. In-game energy attribute names, mapped to the sheet: **ATK Energy Regen** = Energy from Attacking, **Energy Regen** = Energy Regeneration, **Energy Increase** = Energy Increase, **ATK Energy Reduction** = Energy Drain on Attack, **Energy Regen when attacked** = Energy from Damage Taken, **Energy Regen upon Defeat** = Energy on Kill, **Energy Surplus** = Energy Remainder. "Energy Reduction on Death" was not seen in any popup. Observed values sit at or just under the sheet's max (Energy Surplus +30.1 slightly exceeds the sheet's 30).
- 2026-09-13 — **Weapons are not divinities.** Weapon attributes are their own system; do not link them to divinities or reuse divinity icons for them, even where the names match.
- 2026-09-13 — **Nezha** (Warrior · DPS · Eternal). Talents: **Wind Fire Wheels** (Ultimate), **Fire-Tipped Spear** (Battle, 2★), **Windfire** (Enhance, 5★), **Armillary Sash** (Special, 8★), **Threefold Arms** (Passive, 12★), **Scorching Ember** (Enhance, 16★). Fire-Tipped Spear grants a chance for **True DMG** on Basic ATK; Scorching Ember and Windfire are stacking debuffs/buffs riding on Wind Fire Wheels. The divine weapon is itself named **Fire-Tipped Spear** (4★) — same name as the talent.
- 2026-09-13 — Nezha's mythic divinities (Artifact screenshot): **ATK** (left) and **Melee DMG Boost** (right) — both already in the catalog.
- 2026-09-13 — Nezha's rainbow-tier artifact skill is **Immortal Divine Body**: on taking fatal damage, instantly restore 55% of max HP and gain 30% DEF and 100% Energy Regen SPD per second for 8s, once per battle. A revive effect, not attached to any talent (like Sea Captain's Ship Raid).

- 2026-09-13 — Hero pages must include the hero-specific **Awakening I and III**; the owner directed transcription from the screenshots in `gameplay/talents/`.
- 2026-09-13 — The owner specified **"awk I: 18s awk III: 22s"**, subsequently confirmed to mean star unlock thresholds.
- 2026-09-13 — **Awakening skills do not need icons.** Show the stage, skill name and description as text.
- 2026-09-13 — The owner's Hero Awaken screenshots show **Sea Captain I: Commander** (allies' DEF +15% from battle start until own death) and **III: Assault** (Torrent and Ship Raid cooldown −25%); **Nezha I: Samadhi Flame** (attacks add damage equal to 3% of enemy Max HP, capped at 150% of Nezha's Attack) and **III: Lotus Ward** (each 10% max HP lost increases own energy recovery upon taking damage by 10%). Nezha's III is inactive in the screenshot, but its description is visible and is recorded.

- 2026-09-13 — The owner confirmed that **Awakening I unlocks at 18★ and Awakening III at 22★**. The values are stars, not seconds.

## How the app models it

- `heroes` table: `slug`, `name`, `role` (warrior | marksman | mage | support),
  `rarity` (mythic | legend | epic), `imageUrl`, `notes`.
- `divinities` table: `slug`, `name` (stat without "All"), `kind` (popup title without
  "Divinity"), `iconUrl` (`/divinities/<slug>.png`). Seeded from `src/data/divinities.ts`
  by `ensureDivinitiesSeeded()` in `src/lib/divinities.ts`; no hero link yet.
- `weapon_attributes` table: `slug`, `name` (as printed in the Possible Attributes
  popup), `sortOrder`. Seeded from `src/data/weapon-attributes.ts` by
  `ensureWeaponAttributesSeeded()` in `src/lib/weapons.ts`; no per-weapon pools and
  no page yet. Not linked to divinities.
- `rune_attributes` table: `runeType` (attack | effect | energy | survival), `slug`,
  `name`, `maxValue` + `isPercent` (e.g. 7 / true = "7.0%", 50 / false = 50 energy),
  `description`, `analysis` (owner's verdict), `sortOrder` (sheet row order). Seeded
  from `src/data/rune-attributes.ts` by `ensureRuneAttributesSeeded()` in
  `src/lib/runes.ts`; no hero link and no page yet.
- `hero_skills` table: `heroId`, `kind` (ultimate | battle | special | attribute |
  enhance | passive), `name`, `description`, `unlockStars`, `iconUrl`, `sortOrder` —
  the six talents.
- Hero-specific awakening I/III: `heroDetailSeeds[slug].awakeningSkills` in
  `src/data/hero-details.ts`, with stage, name, description and source
  screenshot filename. `getHeroDetail()` includes this fixed content directly,
  without adding database queries or per-view synchronization writes.
  `HERO_AWAKENING_STAGES` stores the shared I → 18★ and III → 22★ thresholds.
- `hero_artifact_bonuses` table: `heroId`, `tier` (purple | gold | red | rainbow),
  `skillId` (the talent it modifies; null for the rainbow-tier artifact skill),
  `name` (rainbow only), `description`, `sortOrder`. A bonus attached to a talent is
  shown under that talent **and** in the Artifacts section; an unattached one only
  in the Artifacts section.
- `hero_cores` table: `heroId`, `skillId` (the talent it modifies), `name` (gear
  name without "·Core"), `description`, `sortOrder`.
- `hero_divinities` table: `heroId`, `divinityId`, `position` (0 = left red, 1 =
  right red) — only the mythic divinities, read from the owner's Artifact screenshots.
- `heroes.artifactName` / `artifactIconUrl` — the divine weapon's name and image.
- Per-hero details are seeded from `src/data/hero-details.ts` by
  `ensureHeroDetailsSeeded()` for heroes that have no skills yet.
- `/heroes/[slug]` — hero detail: large portrait, badge + name, class, notes, skills
  (empty until recorded), and every saved lineup the hero appears in. "Start a lineup
  with X" opens the builder with that hero pre-placed in slot 1.
- `lineups` + `lineup_heroes`: a named lineup with a free-text write-up and up to 5
  `(position, hero)` rows, position 0–4. Deleting a hero or lineup cascades.
- `/divinities` — read-only list of all divinities, grouped by kind, icon + name.
- `/divinities/[slug]` — one divinity: icon, name, kind, and the heroes whose mythic
  divinities include it (portrait grid linking to the hero pages). Divinity badges on
  `/divinities` and on hero pages link here. All seeded heroes are synced on load so
  the list is complete regardless of which hero pages were opened.
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
`gameplay/heroes/` (Archive screen, 3 cards per row). Do not source hero
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

Because image files are replaced in place, every game image URL carries a
cache-busting `?v=N` from `src/lib/asset-version.ts` (`versioned()`). Bump
`ASSET_VERSION` after re-slicing anything (portraits, divinity / talent / artifact
icons); `next.config.ts` allows exactly that query string for all local images.
Symptom when forgotten: the browser keeps showing the old icon.

The portrait tile keeps the card's 81:100 aspect ratio so the whole panel shows.

### Talent icon pipeline

`scripts/slice-talent-icons.py` cuts, per hero listed in its `LAYOUT`, from the
Talent-tab popup screenshots in `gameplay/talents/` (699×1260 phone captures): the
round talent icon (`public/talents/<hero>/<skill-slug>.png`), the artifact-bonus
diamond for each quality tier (`public/icons/artifact-{purple,gold,red}.png`), the
core gem (`public/icons/core.png`), and the artifact image from the Artifact tab
(`public/artifacts/<hero>.png`). The shared icons are written once. Paths are then
referenced by hand in `src/data/hero-details.ts`; the hero page syncs that seed
into the DB on view (`syncHeroDetail`).

### Divinity icon pipeline

`scripts/slice-divinities.py` reads every popup screenshot in `gameplay/divinities/`,
finds the badge by the red title bar and the blue circle, groups duplicates by badge

- title + stat text, and matches each group to its hard-coded `CATALOG`
  (representative screenshot → name, kind). It writes `public/divinities/<slug>.png`
  (badge with transparent background, ~98 px), `src/data/divinities.ts` and
  `scripts/upsert-divinities.sql`. Unmatched screenshots are listed and fail the run:
  add a CATALOG row for each and rerun. Screenshots that are not popups (e.g. the
  divine weapon screen itself) are ignored.

### Rune attribute pipeline

`scripts/import-rune-attributes.py` parses the four sheet exports in `gameplay/runes/`
(the `Category | Max Value | Description | Analysis` table under each type's heading;
the priority table below it is skipped) and writes `src/data/rune-attributes.ts` and
`scripts/upsert-rune-attributes.sql`. Sheet typos are corrected in the script's
`NAME_FIXES` / `ANALYSIS_FIXES`, not in the CSVs, so a fresh export can be dropped in
verbatim. After re-running it, run the upsert SQL against Supabase (or let
`ensureRuneAttributesSeeded()` insert new rows on next read — it never updates
existing ones).

### Weapon attribute pipeline

`scripts/import-weapon-attributes.py` OCRs every screenshot in `gameplay/weapons/`
with macOS Vision (`scripts/ocr-text.swift`, compiled on first run into
`scripts/__pycache__/`), keeps the "Possible Attributes" popups, and matches the text
against its hard-coded `CATALOG` of names. Duplicate screenshots
collapse naturally because only the union of names is written, once each. It writes
`src/data/weapon-attributes.ts` and `scripts/upsert-weapon-attributes.sql`, and
prints the distinct pools it saw for reference. A popup with no recognised name, or
a CATALOG name never seen, fails the run: add the row (or the screenshot) and rerun.

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
