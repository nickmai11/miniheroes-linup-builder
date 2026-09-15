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
| Eternal | cyan/blue-to-purple gradient | 2 |
| Mythic | red             | 40    |
| Legend | gold            | 14    |
| Epic   | purple          | 11    |

The small **diamond in the bottom-left of a card is artifact progress**, not part of
the hero art. It is removed from the portraits in this app.

Hero portraits show an indicator when that hero has at least one saved build
(owner, 2026-09-14). This indicates build availability for the hero, independent
of whether a build is assigned to a particular lineup slot.
In the hero pool, heroes with at least one saved build appear first (owner,
2026-09-14). Within each group, sort by rarity (Eternal, Mythic, Legend, Epic),
then class (Warrior, Marksman, Mage, Support), then name; rarity precedes class
per the owner's 2026-09-15 request.
The build indicator keeps its hammer icon, overlaid with a thick green checkmark
without a background behind the check. Both scale with the portrait
(owner, 2026-09-14). The hammer's background must have enough contrast to remain
noticeable against the hero artwork (owner, 2026-09-14).
Hovering it shows a styled tooltip rather than a native HTML title
(owner, 2026-09-14).

Roster as of 2026-09-14 (67 heroes) — see the table at the end of this file. The
seed data lives in `src/data/heroes.ts`. The September 14 follow-up Archive
capture `gameplay/heroes/image copy 9.png` shows an **Eternal 2/2** section:
**Hellscream (Warrior)** and **Dark Queen (Marksman)**. This establishes two
additional heroes and Eternal as an Archive rarity, bringing screenshot-backed
coverage to **67 heroes**, now included in the seed. The rarity model, sorting,
and portrait pipeline support Eternal. Their owner-supplied Archive cards supply
the whole colored art panels; the portrait pipeline removes their bottom-left
artifact-progress diamonds. Do not substitute Mythic or Epic for the displayed
Eternal rarity.

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

For the **2026-09-14 7.52–8.05 AM screenshot batch and subsequent import**, the owner explicitly
excluded Awakening I/III from the requested scope. Those stages do not block
adding the supplied details; leave unrecorded awakenings empty and preserve any
existing awakening data. This is a batch-specific scope, not a change to the
game's awakening rules.

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
ring. Kinds seen: Ultimate Skill, Special Skill, Battle Skill, Enhance, Attribute,
Passive, Aura. **Aura** is shown on Skeleton King's **Bloodthirsty Curse** (2★)
and Moon Goddess's **ATK SPD Aura** (16★) in the September 14 8.35–8.45 AM
screenshots, and Snowoman's **Glorious Aura** (8★) in the 9.58 AM batch;
the app stores and displays that kind as **Aura**. The ring position determines
unlock stars, not kind: Holy Healer's 2★
talent is Enhance; Silence and Gunslinger's 2★ talents are Special Skill.
Each talent has a name and description; a progress bar ("Max" / "Currently full")
tracks talent levels. Tapping a talent opens up to three panels:

1. the talent itself (kind + description),
2. **Artifact Bonus** — an extra effect on that talent, colour-coded by the
   artifact quality that unlocks it (purple, gold, red, rainbow diamond),
3. **`<Gear>·Core`** — a core bonus that further modifies the talent, e.g.
   "Cavalier Helm·Core: 「Water Blade」 additionally inflicts True DMG equal to
   18%(54%) of Attack". The four cores are Helm, Armor, Boots and the weapon
   (Blade of Valor for Sea Captain). The app stores the core name without the
   "·Core" suffix.

**Artifact tab.** The hero's divine weapon: a named artifact with stars and
ATK/DEF/HP (player-dependent, not stored), an "Ascension Bonus" line, and the six
divinity badges around it. The artifact popup lists one ability per quality tier:
purple / gold / red / rainbow. Quality does not determine whether the ability
modifies a talent or is standalone: Dark Knight's gold **Frost Dark Axe**,
Gunslinger's gold **Full-out Shooting**, and Witch Dictator's red **Withering
Fear** are standalone; rainbow may be standalone (Sea Captain: **Ship Raid**)
or modify a talent (Thrall: **Thunder Strike**, Gunslinger: **Snipe**, Witch
Dictator: **Frost Echo**). The app stores all four in
`hero_artifact_bonuses`; only standalone abilities have no talent link.

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

**Shadow Fiend** (Marksman · DPS · Eternal; artifact **Soul Mask**):

| Talent | Kind | Unlock | Artifact Bonus | Core |
| ------ | ---- | ------ | -------------- | ---- |
| Soul Requiem | Ultimate Skill | Start | — | Swift Longbow: +60% Attack's Physical DMG |
| Soul Burn | Battle Skill | 2★ | purple: each Basic ATK/Skill Cast adds 0.6% ATK, up to 15 stacks | Arrow Core: +0.5%(1.5%) ATK SPD |
| Ghost Curse | Enhance | 5★ | — | Hunter's Cloak: duration +1(3)s, enemy Ranged DMG Boost −5%(15%) |
| Destructive Gloom | Special Skill | 8★ | gold: 1s stun and 14% damage-to-HP conversion; red: free cast on entering battle, Shadow Physical DMG +90% | Crystal Pendant: after each cast, 6% DMG Reduction for 10s and 100% chance to purge all negative effects from self |
| Haunted | Passive | 12★ | — | — |
| Spiteful Curse | Enhance | 16★ | — | — |

The two red divinity icons on the Artifact tab match **Physical DMG Boost**
(left) and **CRIT Damage** (right) in the owner's screenshot-derived catalog.
Both gold and red artifact bonuses modify **Destructive Gloom**, so a talent may
have more than one artifact bonus. The full Soul Mask ability popup is missing:
its rainbow-tier ability is unrecorded. The scrolled follow-up
`gameplay/talents/image copy.png` completes the red bonus and fourth core,
**Crystal Pendant**, linked to **Destructive Gloom**. The popup names
**Arrow Core·Core**; removing only the final UI suffix gives **Arrow Core**.
Full visible descriptions are transcribed in `src/data/hero-details.ts`.

**Necromancer** (Support · Heal · Eternal; artifact **Ghostlight Bone**):

| Talent | Kind | Unlock | Artifact Bonus | Core |
| ------ | ---- | ------ | -------------- | ---- |
| Death Pulse | Ultimate Skill | Start | red: +1 pulse; free cast the first time any ally or self falls below 35% HP, once per battle | Crystal Staff: DMG and Heal +30% of Attack |
| Reaper Scythe | Battle Skill | 2★ | purple: enemy ATK −10% for 8s on hit | Tome of Radiance: additional Magic DMG equal to 80%(240%) of Attack |
| Dark Pulse | Enhance | 5★ | — | — |
| Ghost Shield | Special Skill | 8★ | gold: immediately casts upon entering battle; first cast also shields the frontmost ally | Luminous Visor: HP Regen +0.2%(0.6%) and Energy Regen +2%(6%) |
| Soul Offering | Passive | 12★ | — | — |
| Necro Arts | Enhance | 16★ | — | Resonance Pendant: ally recovery effects +10%(30%) |
| Exhaustion Aura | Artifact | Rainbow tier | On entering battle, reduces all enemies' DMG by 12% and Energy Regen by… (remaining text obscured) | — |

The Artifact tab's red badges match **Healing Effect** (left) and **CRIT DMG
Reduction** (right) in the screenshot-derived catalog. The 9.19.54 AM artifact
popup confirms all four tiers, but its Max Quality footer hides the rest of
**Exhaustion Aura** after "and Energy Regen by". This rainbow skill is not attached
to a talent. All four cores are now recorded: the scrolled 9.31.17 AM capture
shows **Crystal Staff·Core**, which enhances **Death Pulse** DMG and Heal by
**30% of Attack**. Luminous Visor's full description is recorded from the
scrolled 9.21.52 AM capture. The Tome of
Radiance description calls its talent **Reaper's Scythe**, but the talent title
is **Reaper Scythe**; link the core to that title. Sources: the owner's
2026-09-13 9.07.31–9.07.41 AM captures in `gameplay/talents/`.

**Thrall** (Support · Heal · Eternal; artifact **Hammer of Destruction**):

| Talent | Kind | Unlock | Artifact Bonus | Core |
| ------ | ---- | ------ | -------------- | ---- |
| Electric storm | Ultimate Skill | Start | purple: storm knockback reduction +8% | Crystal Staff: enemy HP Regen per second −1.2%(3.6%) |
| Thunder Strike | Battle Skill | 2★ | gold: each strike hits one extra enemy; rainbow: briefly reduces ATK/MOV SPD and reduces Energy Regen SPD by 50% per sec for 6s | Tome of Radiance: True DMG equal to 15%(45%) of Attack |
| Enhanced Storm | Enhance | 5★ | — | — |
| Guardian Rune | Special Skill | 8★ | red: on application, damage taken −20% for 8s; fatal-hit healing +16% max HP | Luminous Visor: additionally restores 3%(9%) of Max HP |
| Orc Soul | Passive | 12★ | — | — |
| Electric Overload | Enhance | 16★ | — | Resonance Pendant: maximum additional damage taken raised to 130%(200%) |

The two red Artifact-tab badges match **Knockback Effect** (left) and **Anti-CRIT
Rate** (right) in the owner's screenshot-derived catalog. All four cores and
artifact tiers are visible, using the scrolled Thunder Strike and Guardian Rune
captures for the lower panels. The **rainbow** bonus also modifies **Thunder
Strike**, not a separate artifact skill; it belongs under the talent and in the
Artifacts section. Preserve the ultimate's in-game title **Electric storm**,
including the lowercase "s", when linking cores and bonuses. The screenshots say
100% magic DMG for the ultimate and 90% true DMG for Thunder Strike without
specifying an ATK basis; do not add one. Sources: the owner's 2026-09-13
9.27.06–9.27.35 AM captures in `gameplay/talents/`.

#### Nine-hero screenshot batch (game, 2026-09-13)

All nine have six talents, four fully recorded cores, four artifact abilities,
and hero-specific Awakening I/III. Existing Archive portraits are retained even
when the gameplay capture uses a different skin. Sources below are AM captures
in `gameplay/talents/`, including scrolled continuations and `AM 1` variants.

| Hero / class | Artifact | Mythic divinities (left → right) | Source range |
| --- | --- | --- | --- |
| Jungle Envoy / Mage | Verdant Staff | Magic DMG Boost → Knockback Effect | 11.33.24–11.33.49; Pulse Nova 11.49.48 and 11.50.02 |
| Radiant Paladin / Support | Sacred Book | Physical RES → Anti-Control Rate | 11.33.58–11.34.20 |
| Silence / Support | Blood Knight | Support ATK → Magic DMG Boost | 11.34.28–11.34.46 |
| Gunslinger / Marksman | Flame-red Robe | Ranged DMG Reduction → CRIT Damage | 11.34.51–11.35.15 |
| Dark Knight / Warrior | Sorrow Frost | Receive Healing → DMG Reduction | 11.35.22–11.35.46 |
| Arcane Saint / Support | Starshine Staff | DEF → HP | 11.35.50–11.36.14 |
| Witch Dictator / Mage | Mana Potion | Magic DMG Boost → Magic RES | 11.36.20–11.36.41; I completed by 11.50.20 and 11.51.47 |
| Silver Warrior / Warrior | Gunblade | ATK → Melee DMG Reduction | 11.36.52–11.37.22 |
| Holy Healer / Support | Recover Staff | Support ATK → Melee DMG Boost | 11.37.31–11.37.50 |

Talents below are in **0★ / 2★ / 5★ / 8★ / 12★ / 16★** order. Full effects and
exact core-to-talent links are in `src/data/hero-details.ts`.

- **Jungle Envoy:** Pulse Nova / Lightning Storm / Enhanced Pulse / Demonic Edict /
  Jungle Warden / Power Surge. Cores: Wizard's Wand, Arcane Hat, Mage Robe, Spell
  Tome. Pulse Nova deals 38% of ATK as magic DMG per second for 7s; Wizard's Wand
  adds 30% Heavy Injury Effect. Its core capture shows no parenthesized value.
- **Radiant Paladin:** Guardian of Light / Sanctity Hammer / Illumination /
  Purifying Light / Sacred Incarnate / Divine Guardian. Cores: Crystal Staff,
  Tome of Radiance, Luminous Visor, Resonance Pendant. Purifying Light is Passive;
  Luminous Visor heals for 30%(100%) of Attack, not 30%(90%).
- **Silence:** Silence Domain / Wisdom Blade / ATK Reduction / Magic Curse /
  Arcane Enhanced / Energy Drain. Cores: Crystal Staff, Tome of Radiance,
  Luminous Visor, Resonance Pendant. Silence Domain literally says "for 4" with
  no duration unit; preserve it rather than inserting seconds.
- **Gunslinger:** Snipe / Shotgun / Quick Snipe / Headshot / Aim / Enhance Snipe.
  Cores: Swift Longbow, Arrow Core, Hunter's Cloak, Crystal Pendant. Gold
  **Full-out Shooting** is standalone; rainbow modifies **Snipe**.
- **Dark Knight:** Darklight Shield / Entangle / Charge / Gloomy Shield /
  Dark Bloodline / Undead. Cores: Blade of Valor, Cavalier Helm, Brawler's Armor,
  Brawler's Boots. Gold **Frost Dark Axe** and rainbow **Evil Aura** are standalone.
- **Arcane Saint:** Golden Holy Bloom / Sage's Gift / Energy Penalty / Unified /
  Vigorous / Guard Bloom. Cores: Crystal Staff, Tome of Radiance, Luminous Visor,
  Resonance Pendant. Rainbow **Summon Beast** summons a Pangolin and Lark.
- **Witch Dictator:** Frost Echo / Frigid Explosion / Ultimate Frost / Frost
  Armor / ATK Amplification / Multifrost. Cores: Wizard's Wand, Arcane Hat, Mage
  Robe, Spell Tome. Red **Withering Fear** is standalone; rainbow modifies Frost
  Echo. Spell Tome's HP recovery increment is 0.3%(1%), exactly as shown.
- **Silver Warrior:** Godslayer Strike / Dawn Slash / Mad Blade / Adrenaline /
  Energy Armor / Annihilation Blade. Cores: Blade of Valor, Cavalier Helm,
  Brawler's Armor, Brawler's Boots. The Boots text says "Blade of Destruction",
  but its talent title/link is **Annihilation Blade**. Rainbow: **Potential Unleashed**.
- **Holy Healer:** Darkness Land / Darkness Strike / Darkness Befalls / Meteor
  Falls / ATK Amplification / Darkest Hour. Cores: Crystal Staff, Tome of Radiance,
  Luminous Visor, Resonance Pendant. Descriptions call the ultimate "Darkness
  Forbidden Land"; links use **Darkness Land**. Gold and red both modify Meteor
  Falls. Rainbow **Starry Salvation** is standalone.

#### Radiant Envoy (game, 2026-09-13)

**Radiant Envoy** is a Mage with artifact **Wand of Light**. The two red
Artifact-tab badges match **DMG Increase** (left) and **Magic DMG Boost** (right).
Sources: the owner's 12.47.59–12.48.15 PM captures in `gameplay/talents/`.

| Talent | Kind | Unlock | Artifact Bonus | Core |
| ------ | ---- | ------ | -------------- | ---- |
| Final Spark | Ultimate Skill | Start | red: full-screen beam plus 55% of Attack as True DMG | Wizard's Wand: additional Magic DMG equal to 30% (90%) of Attack |
| Light Binding | Battle Skill | 2★ | purple: binding duration +1s | Arcane Hat: light orb launch chance +10% (30%) |
| Enhanced Flash | Enhance | 5★ | — | — |
| Prismatic Barrier | Special Skill | 8★ | gold: first cast at 5s; subsequent cooldowns −3s | Mage Robe: additionally reduces enemies' Attack Speed by 12% (36%) for 6s |
| Light Body | Passive | 12★ | — | — |
| Beam Charge | Enhance | 16★ | — | Spell Tome: enemies' Melee DMG Reduction reduced by 27% (80%) for 6s |
| Lucent Singularity | Artifact | Rainbow tier | At 8s, creates a zone at the farthest enemy, reduces ATK SPD by 25%, silences Supports, then detonates after 3s for 300% of Attack as Magic DMG; 15s cooldown | — |

**Lucent Singularity** is standalone. The scrolled 12.48.15 PM artifact popup
completes its description, and 12.48.06 PM completes the Mage Robe core. Preserve
Spell Tome's exact **27% (80%)** and **Melee DMG Reduction** wording; do not
normalize it to 81% or to another stat. The existing Archive portrait is retained.

#### September 14 hero details (game, 2026-09-14)

The 171 owner captures in `gameplay/talents/`, **2026-09-14 7.52.49–7.57.51 AM**,
cover 16 heroes. **Radiant Paladin, Dark Knight, Silence, and Holy Healer** already
have detail entries. The other 12 now have detail seeds, using their existing
Archive-derived roster entries and portraits. The follow-up **8.05.14 AM** capture
completes Mermaid Princess's fourth core. The owner authorized adding these
heroes after the readiness review.

All 12 have six talent popups, their talent-ring reference, an Artifact tab, and
all four artifact abilities (combining scrolled continuations). All their red
badges match the existing divinity catalog. With the Mermaid Princess follow-up,
**all 12 have four recorded core descriptions**. Their 72 talent icons and 12
artifact images come from the normal screenshot crop pipeline. Awakening I/III
remain unrecorded for this batch, as requested by the owner.

| Hero / class | Artifact | Mythic divinities (left → right) | AM source range | Core coverage |
| --- | --- | --- | --- | --- |
| Hela / Mage | Spectral Crystal | SPD Reduction RES → CRIT Rate | 7.53.21–7.53.36 | 4 |
| Shadow Master / Marksman | Grass Cutting Sword | Ranged DMG Boost → Knockback Effect | 7.54.01–7.54.19 | 4 |
| Medusa / Marksman | Succubus Mask | Ranged DMG Boost → DMG Increase | 7.54.39–7.54.53 | 4 |
| Two-Headed Dragon / Mage | Icy Heart | HP → Heavy Injury | 7.54.58–7.55.12 | 4 |
| Mermaid Princess / Support | Shallow Staff | HP → Anti-Control Rate | 7.55.18–7.55.33; 8.05.14 | 4 |
| Soul Doll / Warrior | Ghost Blade | Receive Healing → Melee DMG Boost | 7.55.38–7.55.51 | 4 |
| Baphomet / Warrior | Demonic Slash | Heavy Injury → ATK SPD | 7.56.13–7.56.29 | 4 |
| Masked Ninja / Warrior | Silverwolf Sword | HP → Magic RES | 7.56.31–7.56.46 | 4 |
| Whaley Imp / Warrior | Trident | HP → Anti-Control Rate | 7.56.50–7.57.03 | 4 |
| Ironblade Mixed-Race / Warrior | Ironwolf Blade | HP → Control RES | 7.57.07–7.57.18 | 4 |
| Roar Warrior / Warrior | Blazing Sun Axe | ATK → Heavy Injury | 7.57.22–7.57.34 | 4 |
| Monkey King / Warrior | Golden Cudgel | Knockback Resist → DMG Reduction | 7.57.37–7.57.51 | 4 |

Mermaid Princess's supplied cores are **Luminous Visor → Sanctus Waterball**
(7.55.22), **Resonance Pendant → Abyssal Waters** (7.55.26), and **Crystal Staff →
Tide of Sighs** (7.55.29), plus **Tome of Radiance → Deep Sea Blessing** from
`Screenshot 2026-09-14 at 8.05.14 AM.png`. This scrolled follow-up completes the
original 7.55.19 AM popup and shows the fourth core's full description:
**「Deep Sea Blessing」 additionally increases the DMG Result of the allied Hero
with the highest Attack by 3%(9%).** All non-awakening screenshot requirements
for Mermaid Princess are now satisfied and imported.

The recorded talent order is **0 / 2 / 5 / 8 / 12 / 16★**:

| Hero | Talents in unlock order |
| --- | --- |
| Hela | Spectral Servant / Dark Swarm / Spectral Drain / Soul Shackles / Undead Corpse / Spectres |
| Shadow Master | Phantom Slash / Illusory Nightmare / Enhance Slash / Flame Bullet / Weakness Break / Blood Thirst |
| Medusa | Energy Barrier / Piercing Arrows / Ultimate Empower / Arcane Serpent / Succubus Ancestry / Sharp Arrowhead |
| Two-Headed Dragon | Frost Domain / Ice and Fire / Enhance Chill / Icy Inferno / Dragon's Blood / Extreme Cold |
| Mermaid Princess | Tide of Sighs / Deep Sea Blessing / Tidal Phenomenon / Sanctus Waterball / Knockback / Abyssal Waters |
| Soul Doll | Soul Scissors / ATK Enhancement / Enhance Scissors / Thread Bind / Spiritual Cultivation / Heavy Blow |
| Baphomet | Demonify / Fanatic / Rebirth / Devil's Entanglement / Devil's Wit / RES Skin |
| Masked Ninja | Barrier Shield / Silent Movement / Enhance Shield / Power Regen / Protect Charm / Super Barrier |
| Whaley Imp | Tsunami / Wave Slash / Enhance Tide / Surge Guard / Deep Sea Buildup / Sea God's Wrath |
| Ironblade Mixed-Race | Sky-Cutting Strike / Armor-Breaking Blow / Enhance Aura / Demonic Lineage / Demonic Boost / Soul Hack |
| Roar Warrior | Elimination Axe / Thirst / Enhance Great Axe / Roar / Battle Soul / Axe of Greatness |
| Monkey King | Golden Cudgel / Stabilizing Cudgel / Enhanced Strike / Monkey Clone / Forest Dance / Ruyi Technique |

Core links and exact descriptions are stored in `src/data/hero-details.ts`.
Not every core follows the usual ultimate/2★/8★/16★ pattern: Hela and Two-Headed
Dragon link Mage Robe to their 5★ talents; Medusa's Swift Longbow links to
Piercing Arrows and Arrow Core to Ultimate Empower; Baphomet's Cavalier Helm
links to Rebirth; Ironblade Mixed-Race's Brawler's Armor links to Enhance Aura
and Brawler's Boots to Demonic Lineage.

Transcription and source notes:

- Hela's activated **Arcane Hat** and **Wizard's Wand** show single values
  (**18%** and **15% of ATK**, respectively). Record what is shown; do not derive
  an unseen parenthesized value.
- Rainbow bonuses attach to **Medusa's Arcane Serpent**, **Two-Headed Dragon's
  Frost Domain**, **Mermaid Princess's Deep Sea Blessing**, **Soul Doll's Soul
  Scissors**, **Masked Ninja's Silent Movement**, and **Monkey King's Monkey
  Clone**. They belong under their talents as well as Artifacts.
- **Whaley Imp's gold Siren's Protection** and **Ironblade Mixed-Race's purple
  Dragon Scale Protection** are standalone artifact abilities.
- Standalone rainbow skills are Hela's **Aura of Dread**, Shadow Master's
  **Soulkeeping Technique**, Baphomet's **Soul Absorption**, Whaley Imp's
  **Siren's Shell**, Ironblade Mixed-Race's **Vampiric Powers**, and Roar
  Warrior's **Blade Vine Armor**.
- Monkey King's purple bonus calls its talent **Sea Stabilizing Needle**, but
  the popup title is **Stabilizing Cudgel**; link to the actual talent title.
- Medusa's purple text calls **Piercing Arrows** "Piercing Arrow" and contains
  "DMGto". The red Arcane Serpent text literally shows `Passive</c:`; it is
  preserved as text. Energy Barrier is labeled Ultimate Skill even though its
  description begins with Passive.
- Two-Headed Dragon's Frost Domain says **within 4,** without a unit, and
  Mermaid Princess's Tide of Sighs says **350 water domain** without a unit.
  Baphomet's Demonify says **range of 600%**. Roar Warrior's red bonus says
  **for a set duration** without a number. Do not fill in these source omissions.
- Soul Doll's Thread Bind core shows **0.3% (1%)**; Baphomet's Rebirth core
  shows **3% (10%)**. Monkey King's Enhanced Strike and Ruyi Technique both
  show **140%**; its Cavalier Helm shows **20% (60%)**, and its Monkey Clone
  core shows **25% (75%)**. Preserve these values without recalculating them.
- Shadow Master's unscrolled Illusory Nightmare source is **7.54.03 AM 1.png**;
  the file without ` 1` completes Arrow Core. Flame Bullet uses **7.54.07 AM.png**
  for its icon and **7.54.07 AM 1.png** for Hunter's Cloak's continuation.
  Masked Ninja's **7.56.33 AM 1.png** completes Cavalier Helm; use the file
  without ` 1` for Silent Movement's icon.
- Other core continuations include Hela **7.53.31**, Medusa **7.54.43**,
  Two-Headed Dragon **7.55.00 / 7.55.08**, Mermaid Princess **7.55.22 / 7.55.29 /
  8.05.14**, Soul Doll **7.55.47**, Baphomet **7.56.17 / 7.56.22**, Roar Warrior
  **7.57.30**, and Monkey King **7.57.43 / 7.57.48**. These scrolled sources
  complete text; all icon sources in the crop script are original popups.
- Artifact continuations complete Hela **7.53.36**, Medusa **7.54.53**,
  Baphomet **7.56.29**, and Roar Warrior **7.57.34**. Existing shared tier and
  core icons are reused; no portrait or pre-existing image changed.
- Baphomet's **7.56.26 AM** divinity popup confirms the left red badge's stat
  **All Heavy Injury**, matching the existing **Heavy Injury** catalog entry.

#### September 14 8.35–8.45 AM screenshot review and import (game, 2026-09-14)

The owner authorized importing this reviewed batch, including **Aura** support.
The original 147 owner screenshots
from **8.35.37–8.45.28 AM**, plus Jungle Archer's nine **9.01.10–9.01.19 AM**
follow-ups, cover 14 heroes. All already have roster entries and
owner-sourced Archive portraits, with the whole art panel and no artifact-progress
diamond. **Gunslinger** already has a detail seed, including I/III; its supplied
talents, cores, artifact tiers, and divinities agree with the recorded content.
The other 13 now have detail entries: Skeleton King, Whirlpool Ninja, Foxy Spirit,
Loli, GooGoo Fish, Moon Goddess, Cowboy Killer, Jungle Archer, White Ox,
Hidden Ninja, Snow Hunter, Swordevil, and Mars.

**All 13 imported heroes have complete non-awakening details:** their six
talent names, kinds, full descriptions, unscrolled icon sources, ring order,
four linked cores, artifact artwork and four abilities, and two catalog-matched
red divinities are supplied. **Jungle Archer's 9.01 AM follow-ups** close its
talent/core gaps, combined with the original Artifact tab and ability popup.
No Hero Awaken screenshots appear in this batch, so I (18★) and III (22★)
remain unrecorded for all 13, with the existing empty states. The import adds
78 talents, 52 linked cores, 52 artifact bonuses, 26 divinity links, and 91 new
talent/artifact images. Aura is supported as its own talent kind; Swordevil's
**Gale Aura** remains **Enhance**, matching its popup. Existing portraits and
shared icons are reused; no existing public image is replaced.

Sources are `gameplay/talents/Screenshot 2026-09-14 at <time> AM.png`, including
the narrow no-break space before `AM` and any ` 1` suffix. Ranges below are AM.
Divinities are the bottom red badges in left/right order, compared visually with
the existing catalog; no additional divinity popup is needed for this batch.

| Hero / class | Artifact | Mythic divinities (left → right) | Source range | Non-awakening evidence |
| --- | --- | --- | --- | --- |
| Skeleton King / Warrior | Blade of Destruction | HP → Heavy Injury | 8.35.37–8.36.29 | Complete |
| Whirlpool Ninja / Warrior | Whirlwind Meteor | HP → CRIT Damage | 8.36.32–8.36.47 | Complete |
| Foxy Spirit / Mage | Exquisite Lamp | Magic RES → CRIT Damage | 8.36.52–8.37.05 | Complete |
| Loli / Marksman | Gatling | Marksman DEF → CRIT Damage | 8.37.08–8.38.59 | Complete |
| GooGoo Fish / Warrior | Dragon Scale | ATK → CRIT Damage | 8.39.04–8.39.17 | Complete |
| Moon Goddess / Marksman | Merciless Crossbow | Marksman DEF → Heavy Injury | 8.39.20–8.40.40 | Complete |
| Cowboy Killer / Marksman | Desert Revolver | Marksman DEF → Physical DMG Boost | 8.41.06–8.41.22 | Complete |
| Jungle Archer / Marksman | Forest Longbow | Marksman DEF → Anti-CRIT Rate | 8.42.09–8.42.10; 9.01.10–9.01.19 | Complete after follow-up |
| White Ox / Warrior | Mountain Splitting Axe | Knockback Effect → Heavy Injury | 8.43.51–8.44.10 | Complete |
| Hidden Ninja / Marksman | Shuriken | Marksman DEF → ATK SPD | 8.44.13–8.44.24 | Complete |
| Snow Hunter / Marksman | Flash Bow | Marksman DEF → CRIT DMG Reduction | 8.44.27–8.44.38 | Complete |
| Gunslinger / Marksman | Flame-red Robe | Ranged DMG Reduction → CRIT Damage | 8.44.40–8.44.56 | Already recorded |
| Swordevil / Warrior | Slaughter | CRIT Damage → CRIT Rate | 8.44.59–8.45.12 | Complete |
| Mars / Warrior | Spear of War | ATK → Physical RES | 8.45.15–8.45.28 | Complete |

Verified talent order is **0 / 2 / 5 / 8 / 12 / 16★**. The matching original
popup times are listed in the same order; these provide usable icon sources.

| Hero | Talents in unlock order | Original popup times (AM) |
| --- | --- | --- |
| Skeleton King | Dark Soul Fireball / Bloodthirsty Curse / Hellfire Heavy Strike / Return from the Underworld / Dark Soul Real Body / Hell King's Howl | 8.35.46 / 8.35.38 / 8.35.40 / 8.35.41 / 8.35.42 / 8.35.44 |
| Whirlpool Ninja | Energy Vortex / Cloning Technique / Enhance Vortex / Unyielding / Ninjutsu / Super Charge | 8.36.42 / 8.36.33 / 8.36.35 / 8.36.37 / 8.36.39 / 8.36.41 |
| Foxy Spirit | Nightfire / Soul Snatcher Orb / Spell Surge / Mind's Mirror / Heart Cleansing / Fox Fire | 8.37.00 / 8.36.53 / 8.36.55 / 8.36.56 / 8.36.57 / 8.36.59 |
| Loli | Super Bullet / Explosive Flying Bullet / Enhance Missile / Explosive Strike / ATK Amplification / Concussion Bullet | 8.38.29 / 8.37.09 / 8.37.11 / 8.37.12 / 8.37.16 / 8.38.06 |
| GooGoo Fish | Aqua Dance / Steal / Water Burst / Sudden Assault / Contract / Dark Shadow | 8.39.13 / 8.39.05 / 8.39.08 / 8.39.09 / 8.39.10 / 8.39.12 |
| Moon Goddess | Meteor Shower / Moon Goddess's Arrow / Meteor Strike / Encourage / ATK Amplification / ATK SPD Aura | 8.39.36 / 8.39.22 / 8.39.23 / 8.39.31 / 8.39.33 / 8.39.35 |
| Cowboy Killer | Barrage Bullets / PEN Bullet / Enhance Ammo / Growth Favors / Precise / Metal Slug | 8.41.17 / 8.41.08 / 8.41.10 / 8.41.11 / 8.41.13 / 8.41.15 |
| Jungle Archer | Gale Arrow / Fiery Barrage / Enhance Arrows / High Speed / Hunter's Lineage / Upgraded Arrows | 9.01.18 / 9.01.11 / 9.01.12 / 9.01.14 / 9.01.16 / 9.01.17 |
| White Ox | Brute Charge / Warrior Charge / Heavy Strike / HP Shield / Indomitable / Brute Strength | 8.44.07 / 8.43.55 / 8.44.01 / 8.44.03 / 8.44.04 / 8.44.05 |
| Hidden Ninja | Beast Pursuit / Paralysis ATK / Beast Possession / Seal Technique / Quick Regen / Super Beast | 8.44.20 / 8.44.14 / 8.44.16 / 8.44.17 / 8.44.18 / 8.44.19 |
| Snow Hunter | Freezing Arrows / Frost Arrows / Speedfrost Arrowhead / Multiarrow / Focus / Explosive Arrows | 8.44.35 / 8.44.28 / 8.44.29 / 8.44.30 / 8.44.32 / 8.44.34 |
| Swordevil | Sweep Army / Thunder Strike / Skill Immunity / Phantom Combo / Strength Awakening / Gale Aura | 8.45.08 / 8.45.00 / 8.45.01 / 8.45.03 / 8.45.04 / 8.45.06 |
| Mars | Spear of War / Shield Bash / Enhance Spear Strike / DEF Stance / Protective Shield / Blood-Stained Spear | 8.45.24 / 8.45.16 / 8.45.18 / 8.45.20 / 8.45.22 / 8.45.23 |

Review notes for a future authorized import:

- **Aura is a supported talent kind** for Skeleton King and Moon
  Goddess; no further screenshot is needed to establish it. Swordevil's
  **Gale Aura** is labeled **Enhance**, and **Strength Awakening** is an
  **Attribute** talent, not an awakening-stage capture. White Ox's 5★
  **Heavy Strike** and Snow Hunter's 8★ **Multiarrow** are **Battle Skill**.
- Talent aliases: Whirlpool Ninja's **Clone** means **Cloning Technique**;
  Foxy Spirit's **Mind's Eye Mirror** means **Mind's Mirror**; White Ox's core
  calls **HP Shield** **Life Shield**; Hidden Ninja's **Thunder Beast Pursuit**
  and **Thunder Beast Possession** link to **Beast Pursuit** and **Beast
  Possession**, respectively. Preserve description wording while linking to
  the actual popup title.
- Core links differ by hero. Skeleton King's Brawler's Armor links to
  **Hellfire Heavy Strike** (5★), Foxy Spirit's Mage Robe to **Spell Surge**
  (5★), and White Ox's Brawler's Armor to **HP Shield** (8★). Moon Goddess's
  Crystal Pendant links to **ATK SPD Aura** (16★); Cowboy Killer's to
  **Growth Favors** (8★), and Loli's to **Explosive Strike** (8★).
- Core continuations are complete: Whirlpool Ninja **8.36.34 / 8.36.38**,
  Foxy Spirit **8.36.54**, Loli **8.37.10 / 8.38.30 / 8.38.33**, GooGoo Fish
  **8.39.07**, Cowboy Killer **8.41.08 AM 1.png / 8.41.12 / 8.41.18**, White Ox
  **8.43.56**, Hidden Ninja **8.44.21**, Snow Hunter **8.44.31 /
  8.44.35 AM 1.png**, Swordevil **8.45.03 AM 1.png / 8.45.08 AM 1.png**, and
  Mars **8.45.17 / 8.45.25**. Files without ` 1` provide the original icon
  popups for the listed same-second pairs. Loli's repeated Super Bullet captures
  include both full talent and full Swift Longbow text; no recapture is needed.
- Artifact continuations **Foxy Spirit 8.37.05** and **Swordevil 8.45.12**
  complete their rainbow text. Foxy Spirit has standalone red **Foxfire Raid**
  and rainbow **Soul Rend**; Skeleton King's rainbow **Soul Guardian**, Loli's
  **Extreme Excitement**, White Ox's **Divine Aura**, and Swordevil's **Healing
  Guard** are also standalone. Rainbow attaches to Whirlpool Ninja's
  **Cloning Technique**, GooGoo Fish's **Aqua Dance**, Moon Goddess's **ATK SPD
  Aura**, Cowboy Killer's **Growth Favors**, Hidden Ninja's **Beast Pursuit**,
  Snow Hunter's **Multiarrow**, and Mars's **Spear of War**.
- Preserve unusual displayed values: Whirlpool Ninja's Cavalier Helm reduces
  clone damage by **80% (250%)**; Loli's Swift Longbow shows **3% (10%)** of
  lost HP, capped at **400% (500%)** of Loli's Attack; Cowboy Killer's Arrow
  Core shows **30% (100%)** and **60% (200%)**; White Ox's Boots show
  **30% (100%)**. White Ox's Brute Charge says **700% Physical DMG** and its
  red bonus **300% True DMG** without an ATK basis; Foxy Spirit's Nightfire
  says **160% Magic DMG** without an ATK basis. Do not supply an unseen basis.
- Jungle Archer's **8.42.10** artifact popup fully shows purple **Fiery
  Barrage** (30% chance to stun for 1.5s), gold **High Speed** (duration +50%),
  red **Gale Arrow** (final DMG Result +60%), and rainbow **High Speed**
  (duration +18s). The **9.01 AM** talent popups confirm these exact talent
  titles and links, including both gold and rainbow on **High Speed**.

**Jungle Archer follow-up review (9.01.10–9.01.19 AM):** all nine new files
belong to Jungle Archer / Marksman. The **9.01.10** talent-ring screenshot
establishes the order above. All six original popups provide full descriptions
and usable icons. The existing Forest Longbow artwork, all four artifact tiers,
and Marksman DEF / Anti-CRIT Rate badges remain verified from **8.42.09 / 8.42.10**.

| Talent | Kind | Unlock | Effect shown in the follow-up |
| --- | --- | --- | --- |
| Gale Arrow | Ultimate Skill | 0★ | Pierces all enemies for Physical DMG equal to 360% of ATK with Knockback; DMG Result and Knockback diminish by 8% with each enemy hit. |
| Fiery Barrage | Battle Skill | 2★ | Basic ATK have a 35% chance to shoot two arrows, each dealing Physical DMG equal to 100% of ATK. |
| Enhance Arrows | Enhance | 5★ | Gale Arrow's Physical DMG increases by 90%. |
| High Speed | Special Skill | 8★ | On entering battle, MOV SPD and ATK SPD increase by 30% for 10s. |
| Hunter's Lineage | Attribute | 12★ | ATK increases by 10%, Armor PEN by 15%. |
| Upgraded Arrows | Enhance | 16★ | Gale Arrow's DMG Result and Knockback Effect no longer diminish upon hitting an enemy. |

All four complete core panels are supplied:

| Gear | Talent link | Displayed core effect | Full-text source (AM) |
| --- | --- | --- | --- |
| Swift Longbow | Gale Arrow | Increases Physical DMG by 40%(120%) of Attack. | 9.01.18; clearer scroll 9.01.19 |
| Arrow Core | Fiery Barrage | Increases each arrow's Physical DMG by 20%(60%) of Attack. | 9.01.11 |
| Hunter's Cloak | Enhance Arrows | “Empowered Arrows” increases Physical DMG by 40%(120%) of Attack. | 9.01.12 |
| Crystal Pendant | High Speed | Additionally increases ATK SPD and MOV SPD by 5%(15%). | 9.01.14 AM 1.png |

**Empowered Arrows** is the Hunter's Cloak description's alias for the popup
title **Enhance Arrows**; link to the actual title. The original
`Screenshot 2026-09-14 at 9.01.14 AM.png` has High Speed's icon and full talent
description; `Screenshot 2026-09-14 at 9.01.14 AM 1.png` is the scrolled
continuation that completes Crystal Pendant. Gale Arrow's icon source is
**9.01.18**, with **9.01.19** providing its scrolled core panel. The only remaining
Jungle Archer evidence gaps are **Awakening I (18★) and III (22★)**. This follow-up
updates readiness only; Jungle Archer and the other 12 new candidates are not
imported.

#### September 14 9.58–10.02 AM screenshot review and import (game, 2026-09-14)

The owner authorized importing this batch after the readiness review. The 162
owner screenshots from **9.58.26–10.02.38 AM**, plus Snowoman's two
**10.10.23 / 10.10.48 AM**
follow-ups, cover 15 heroes. **Witch Dictator, Silver Warrior,
and Arcane Saint** already have detail entries, including I/III; their supplied
talents, cores, artifact abilities, and divinities agree with those entries.
The other **12** now have detail seeds and new talent/artifact crops. Their
existing owner-sourced Archive portraits show the whole art panel without the
artifact-progress diamond, and remain usable even where gameplay uses a skin.

**All twelve imported heroes have complete recorded non-awakening details:**
six talent names/kinds/descriptions and verified icon sources, four complete
linked cores, artifact artwork and all four abilities, and two catalog-matched
mythic badges.
**Snowoman's 10.10.23 AM follow-up completes Blizzard and Crystal Staff.**
Its original 9.58.26 ring supplies the full Blizzard icon. No Hero Awaken
screen appears in this batch; **I (18★) and III (22★) are missing for all 12 new
candidates**. The earlier batch's awakening exclusion does not apply to this
import. Their pages retain the unrecorded states at 18★/22★.

The import adds **72 talents, 48 linked cores, 48 artifact abilities, 24 mythic
divinity links, and 84 public images** through the existing seed/crop pipeline.
All 412 previously existing PNGs, including portraits and shared tier/core icons,
remain byte-identical; adding these new paths needs no asset-version bump.
Snowoman's Blizzard uses the documented per-talent ring crop override. No new
roster entry, divinity, awakening skill, or saved build is inferred from this batch.

Verification on 2026-09-14: all twelve heroes synchronized through the existing
`getHeroDetail` flow, with exact core/artifact links and divinity order checked.
Isolated rendering of the real hero page passed for all twelve, including the
six talent-attached rainbow bonuses in both sections and the 18★/22★ empty
states. Typecheck, lint, and diff checks passed; tests reported 197 passed and
5 skipped. Authenticated live page/image responses remain unverified: the local
server requires a registered device session, and unauthenticated requests return
an invitation redirect or 401.

All source times below refer to
`gameplay/talents/Screenshot 2026-09-14 at <time> AM.png`; preserve the narrow
no-break space and any ` 1` suffix. Divinities were compared visually with
`src/data/divinities.ts` and `public/divinities/`, in bottom-left → bottom-right
order. No new divinity popup is needed for this batch.

| Hero / class | Artifact | Mythic divinities (left → right) | AM source range | Non-awakening evidence |
| --- | --- | --- | --- | --- |
| Snowoman / Support | Soulseeker Staff | Support ATK → Melee DMG Reduction | 9.58.26–9.58.43; 10.10.23 / 10.10.48 | Complete after follow-up |
| Bamboo Hat / Mage | Witherwood Staff | HP → Ranged DMG Reduction | 9.58.46–9.58.57 | Complete |
| Fire Sorceress / Mage | Flame Crown | Mage ATK → Magic RES | 9.59.01–9.59.20 | Complete |
| Red Hood / Mage | Captain Headgear | Receive Healing → Knockback Resist | 9.59.23–9.59.38 | Complete |
| Little Goblin / Mage | Goblin Wrench | Mage ATK → Heavy Injury | 9.59.40–9.59.51 | Complete |
| Radiant Angel / Support | Angel Staff | Support ATK → Knockback Resist | 9.59.54–10.00.06 | Complete |
| Diva / Support | Crystal Necklace | HP → Healing Effect | 10.00.14–10.00.26 | Complete |
| Little Deer / Support | Ironskin Staff | HP → Melee DMG Reduction | 10.00.29–10.00.46 | Complete |
| Witch Dictator / Mage | Mana Potion | Magic DMG Boost → Magic RES | 10.00.50–10.01.03 | Already recorded; agrees |
| Lucifer / Warrior | Blood Demon Crystal | SPD Reduction RES → Physical RES | 10.01.06–10.01.21 | Complete |
| Captain Pilot / Marksman | Energy Spring | CRIT Damage → Ranged DMG Reduction | 10.01.27–10.01.39 | Complete |
| Li Bai / Marksman | Lotus Nectar | Physical RES → Ranged DMG Reduction | 10.01.41–10.01.55 | Complete |
| Lady Pan / Support | Nonstick Pan | ATK → HP | 10.01.59–10.02.11 | Complete |
| Silver Warrior / Warrior | Gunblade | ATK → Melee DMG Reduction | 10.02.13–10.02.24 | Already recorded; agrees |
| Arcane Saint / Support | Starshine Staff | DEF → HP | 10.02.27–10.02.38 | Already recorded; agrees |

The imported heroes' talent order is **0 / 2 / 5 / 8 / 12 / 16★**. Names and kinds
come from their actual popups; Snowoman's **10.10.23 AM** follow-up confirms
Blizzard's Ultimate Skill kind and full base description, matching the ring.

| Hero | Talents in unlock order |
| --- | --- |
| Snowoman | Blizzard / Ice Blast / Bone-Chilling Cold / Glorious Aura / Ice Purification / Storm Domain |
| Bamboo Hat | Energy Impact / Weakness Sensing / Energy Overload / Qi Mantra / ATK Amplification / Energy Burst |
| Fire Sorceress | Flame Shock / Burn / Blazing Slash / Blaze / ATK Amplification / Enhance Impact |
| Red Hood | Mushroom Bomb / Poisoned Shooting / Here comes the bomb / Time Bomb / I am Red Hood / Big-headed Mushroom |
| Little Goblin | Master of Machinery / Throw Mastery / Quick Release / DEF Formation / Knockback Boost / Spare Tool |
| Radiant Angel | Holy Light Protection / Judgement / Enhance Protection / Holy Light Shines / Holy Soul / Super Protection |
| Diva | Protagonist Arrive / Full-out Merrying / Enhance Stage / Revisit / Excited / Plot Armor |
| Little Deer | Awaken / Poisoned Spear / Purify / Nourishment / Assist / Cleanse |
| Lucifer | Doomsday Curse / Flame Blade / Strengthen Curse / Demon Fire / Demonic Contract / Hatred Deepens |
| Captain Pilot | Warrior Strike / Molotov Cocktail / Enhance Bullet / Suppressive Shoot / Weakness Break / Explosive Bullet |
| Li Bai | Sky-Splitting Sword / Twin Swords / Sword Breaker / Sword Beam / Lotus Sword / Man and Sword |
| Lady Pan | Cutlery Throw / Home Delivery / Precise Throw / Deluxe Cake / Culinary Mastery / Spare Cutlery |

At 2★, **Ice Blast, Full-out Merrying, and Home Delivery are Special Skill**;
the other new candidates' 2★ popups are Battle Skill. At 8★, **Glorious Aura is
Aura**, **Blaze and Revisit are Enhance**, and **Time Bomb is Battle Skill**;
the others are Special Skill. All supplied 5★/16★ popups are Enhance and all
12★ popups are Attribute. Little Deer's **Awaken** is its ultimate talent;
that title does not supply hero-specific awakening evidence.

Talent popup times below follow the same unlock order. These provide original
icons except Snowoman's scrolled Blizzard follow-up: use its **9.58.26 AM**
ring for the full icon. A suffix explicitly shown as `AM 1.png` is part of the filename.

| Hero | Talent popups (0 / 2 / 5 / 8 / 12 / 16★) | Artifact tab | Ability popup / continuation |
| --- | --- | --- | --- |
| Snowoman | 10.10.23 / 9.58.29 / 9.58.31 / 9.58.32 / 9.58.33 / 9.58.35 | 9.58.42 | 9.58.43 |
| Bamboo Hat | 9.58.54 / 9.58.47 / 9.58.49 / 9.58.50 / 9.58.52 / 9.58.53 | 9.58.56 | 9.58.57 |
| Fire Sorceress | 9.59.17 / 9.59.02 / 9.59.11 / 9.59.13 / 9.59.14 / 9.59.15 | 9.59.18 | 9.59.19 / 9.59.20 |
| Red Hood | 9.59.34 / 9.59.24 / 9.59.25 / 9.59.26 / 9.59.32 / 9.59.33 | 9.59.37 | 9.59.38 |
| Little Goblin | 9.59.47 / 9.59.41 / 9.59.42 / 9.59.43 / 9.59.45 / 9.59.46 | 9.59.50 | 9.59.51 |
| Radiant Angel | 10.00.02 / 9.59.55 / 9.59.57 / 9.59.58 / 10.00.00 / 10.00.01 | 10.00.05 | 10.00.05 AM 1.png / 10.00.06 |
| Diva | 10.00.22 / 10.00.15 / 10.00.16 / 10.00.18 AM 1.png / 10.00.18 / 10.00.21 | 10.00.25 | 10.00.26 |
| Little Deer | 10.00.42 / 10.00.30 / 10.00.33 / 10.00.34 / 10.00.39 / 10.00.40 | 10.00.45 | 10.00.46 |
| Lucifer | 10.01.16 AM 1.png / 10.01.07 AM 1.png / 10.01.09 / 10.01.10 / 10.01.12 / 10.01.13 | 10.01.19 | 10.01.21 AM 1.png / 10.01.21 |
| Captain Pilot | 10.01.35 / 10.01.27 / 10.01.28 / 10.01.29 / 10.01.32 / 10.01.33 | 10.01.37 | 10.01.38 / 10.01.39 |
| Li Bai | 10.01.50 / 10.01.42 / 10.01.44 / 10.01.45 / 10.01.46 / 10.01.48 | 10.01.53 | 10.01.54 / 10.01.55 |
| Lady Pan | 10.02.07 / 10.02.00 / 10.02.02 / 10.02.03 / 10.02.05 / 10.02.06 | 10.02.09 | 10.02.10 / 10.02.11 |

Ring references are the first image in each hero's source range, except Captain
Pilot: no separate unobstructed ring was supplied, but its positions/names are
visible behind the 10.01.28 / 10.01.32 popups. The separate ring is optional.

Verified core links (full effects are transcribed in `src/data/hero-details.ts`):

| Hero | Gear → talent |
| --- | --- |
| Snowoman | Crystal Staff → Blizzard; Tome of Radiance → Ice Blast; Luminous Visor → Bone-Chilling Cold; Resonance Pendant → Glorious Aura |
| Bamboo Hat | Wizard's Wand → Energy Impact; Arcane Hat → Weakness Sensing; Mage Robe → Qi Mantra; Spell Tome → Energy Burst |
| Fire Sorceress | Wizard's Wand → Flame Shock; Arcane Hat → Burn; Mage Robe → Blaze; Spell Tome → Enhance Impact |
| Red Hood | Wizard's Wand → Mushroom Bomb; Arcane Hat → Poisoned Shooting; Mage Robe → Time Bomb; Spell Tome → Big-headed Mushroom |
| Little Goblin | Wizard's Wand → Master of Machinery; Arcane Hat → Throw Mastery; Mage Robe → Quick Release; Spell Tome → DEF Formation |
| Radiant Angel | Crystal Staff → Holy Light Protection; Tome of Radiance → Judgement; Luminous Visor → Holy Light Shines; Resonance Pendant → Super Protection |
| Diva | Crystal Staff → Protagonist Arrive; Tome of Radiance → Full-out Merrying; Luminous Visor → Revisit; Resonance Pendant → Plot Armor |
| Little Deer | Crystal Staff → Awaken; Tome of Radiance → Poisoned Spear; Luminous Visor → Nourishment; Resonance Pendant → Cleanse |
| Lucifer | Blade of Valor → Doomsday Curse; Cavalier Helm → Flame Blade; Brawler's Armor → Strengthen Curse; Brawler's Boots → Demon Fire |
| Captain Pilot | Swift Longbow → Warrior Strike; Arrow Core → Molotov Cocktail; Hunter's Cloak → Suppressive Shoot; Crystal Pendant → Explosive Bullet |
| Li Bai | Swift Longbow → Sky-Splitting Sword; Arrow Core → Twin Swords; Hunter's Cloak → Sword Beam; Crystal Pendant → Man and Sword |
| Lady Pan | Crystal Staff → Cutlery Throw; Tome of Radiance → Home Delivery; Luminous Visor → Deluxe Cake; Resonance Pendant → Spare Cutlery |

Review and transcription notes:

- **Snowoman follow-up review:**
  `Screenshot 2026-09-14 at 10.10.23 AM.png` shows **Blizzard (Ultimate Skill,
  0★)** and its complete fourth core, **Crystal Staff·Core**. Blizzard summons
  **3 waves**, each dealing Magic DMG equal to **80% of ATK** to enemies within
  range. Crystal Staff **increases Magic DMG by 20%(60%) of Attack**, linked to
  **Blizzard**. Its gold bonus agrees with 9.58.43: Magic DMG per wave +50%,
  and enemies struck have a 50% chance to be frozen for 1s. The follow-up popup
  is slightly scrolled at its top edge, so use the fully visible central
  Blizzard icon in **9.58.26 AM** with a dedicated ring crop; do not run the
  usual fixed popup-icon crop on 10.10.23. No additional icon capture is needed.
  `Screenshot 2026-09-14 at 10.10.48 AM.png` repeats the Ice Blast scroll,
  matching the original **9.58.29** popup and **9.58.30** continuation: **Tome
  of Radiance → Ice Blast**, Magic DMG **+50%(150%) of Attack**. The other
  two cores are complete at 9.58.31 / 9.58.32. **Glorious Aura** restores **40
  energy to all allied heroes every 3s**; its core adds **5(15) Energy each
  time**. Soulseeker Staff's four abilities are complete at 9.58.43: standalone
  purple **Ice Seal Technique**, gold **Blizzard**, red **Ice Blast Technique**
  (alias for **Ice Blast**), and rainbow **Glorious Aura**.
  With these two follow-ups, Snowoman has all six talents and four cores;
  **only Awakening I/III remain missing**, bringing all twelve new candidates
  to complete non-awakening readiness. These details are now imported following
  the owner's authorization.
- Core continuations: Bamboo Hat **9.58.48**; Fire Sorceress **9.59.09**;
  Red Hood **9.59.31 / 9.59.35**; Little Goblin **9.59.44 / 9.59.48**;
  Radiant Angel **10.00.03**; Diva **10.00.15 AM 1.png / 10.00.23**;
  Lucifer **10.01.07 / 10.01.11 / 10.01.16**; Captain Pilot **10.01.30**
  (10.01.35 AM 1.png is an alternate shifted ultimate popup); Li Bai
  **10.01.51**; Lady Pan **10.02.01 / 10.02.04**. Original unscrolled icon
  sources are listed above; a duplicate suffix alone does not identify a scroll.
- **Fire Sorceress:** purple and gold modify **Burn**. Red introduces standalone
  **Blazing Fire**, and rainbow further modifies that same artifact ability;
  both use the standalone title, since no talent is named Blazing Fire. The
  **9.59.20** scroll completes rainbow's **20%** range increase and **40 Energy
  points within 5s after skill use**. Burn's purple **12% Magic DMG per second**
  has no displayed ATK basis. Wizard's Wand literally shows **20(60%)%**;
  Arcane Hat shows **3%(10%)**. Preserve the source values/wording.
- Other standalone rainbow abilities: Little Goblin **Energy Recharge Shield**,
  Little Deer **Divine Light Shelter**, Captain Pilot **Armor PEN Bullet**,
  Li Bai **Hero's Journey**, and Lady Pan **Random Snack**. The supplied scrolls
  at **10.01.39 / 10.01.55 / 10.02.11** complete the last three. Random Snack
  includes all three buffs: Custard Tart (ATK SPD/MOV SPD), Cake (ATK), and Burger
  (DEF), each **25% for 5s**.
- Rainbow attaches to Bamboo Hat's **Weakness Sensing**, Red Hood's **Mushroom
  Bomb**, Radiant Angel's **Holy Light Protection**, Diva's **Protagonist Arrive**,
  and Lucifer's **Demon Fire**. Radiant Angel's **10.00.06** scroll completes
  the rainbow text, including **ATK by 200%** and CRIT immunity. Diva has purple
  and red bonuses on **Full-out Merrying**, gold and rainbow on **Protagonist
  Arrive**. Lady Pan has both purple and gold on **Home Delivery**.
- Title aliases: Bamboo Hat's gold **Qi Consolidation Mantra** links to **Qi
  Mantra**; Captain Pilot's gold **Suppressive Shooting** links to **Suppressive
  Shoot**. Keep Red Hood's capitalization **Here comes the bomb / I am Red Hood**.
- Preserve fully visible unusual wording: Red Hood's gold Time Bomb says
  **within 2 upon explosion** without a unit; Lucifer's Doomsday Curse says
  **100% Physical DMG per second** without an ATK basis; Li Bai's Sword Beam
  says **3% of ATK**, and its Hunter's Cloak says **consumes 15(45) less energy**.
  Bamboo Hat's Arcane Hat cap is **115%(150%) of Bamboo Hat's Attack**;
  Little Deer's Luminous Visor shows **30%(100%)**. These are not clipped text
  and do not require invented corrections or recaptures.
- The repeated existing heroes introduce no contradictions. Witch Dictator's
  Frost Armor original is **10.00.55 AM 1.png**, with the file without ` 1`
  completing Spell Tome. Silver Warrior's Godslayer Strike original is
  **10.02.21 AM 1.png**, with the file without ` 1` completing Blade of Valor.
  Arcane Saint's **10.02.38** scroll fully shows Summon Beast, matching its seed.

#### September 14 10.40–10.45 AM screenshot review and import (game, 2026-09-14)

The owner authorized importing the reviewed batch using multiple agents. The
**179** original owner screenshots, **10.40.34–10.45.03 AM**, cover **16 heroes**:
twelve existing roster heroes previously without detail entries, two new heroes
(**Hellscream** and **Dark Queen**), and two already recorded heroes
(**Thrall** and **Radiant Envoy**). All captures are 706×1255. The pending-file
inventory included staged, unstaged, and untracked images; this batch was untracked.

**Follow-up review, 2026-09-14:** four **10.57.41–10.58.01 AM** talent-folder
captures plus `gameplay/heroes/image copy 9.png` resolve all of the original
non-awakening screenshot gaps. The review now covers **184 source images**
(183 in `gameplay/talents/` and one new Archive capture), supplying this import.

**Awakening I (18★) and III (22★) remain required.** No Hero Awaken screen
appears in this batch, and none of the fourteen new detail candidates has an
existing awakening entry. Earlier batches' exclusions do not apply. Thrall's
I/III are already screenshot-backed; Radiant Envoy retains its owner-approved
guide source. Their repeated talents, cores, artifact abilities, and divinities
agree with the existing seeds.

**All fourteen new detail candidates now have complete non-awakening screenshot
evidence.** Abyssal Queen's fourth core is supplied, and Templar now has its
Artifact tab and full ability popup. Hellscream and Dark Queen's new Archive
capture supplies whole-card portrait sources and establishes **Eternal** rarity,
with Warrior and Marksman class badges respectively. They are now included in
the roster and crop-script layout, with Eternal rarity support and new portraits.
The other fourteen heroes' existing portraits retain the whole owner-sourced
card art with the artifact-progress diamond removed.

The import adds **84 talents, 56 linked cores, 56 artifact abilities, 28 mythic
divinity links, and 100 new images** (84 talents, 14 artifacts, two portraits).
All 496 existing PNGs remain byte-identical, so no asset-version bump is needed.
That batch brought the app to 67 roster heroes and 66 detail entries. The later
12.58 PM Swordmaster import brings detail coverage to all 67 roster heroes.
Hellscream and Dark Queen use `eternal` rarity in the
existing text-backed rarity column, labels, sort order, and portrait pipeline;
this addition requires no database migration.

Sickle of Fear uses its unobscured **10.41.04 AM** ability-popup artwork:
progress stars overlap its upper blade tip on the Artifact tab. Earthbreaker's
artifact polygon excludes nearby stars while retaining its upper ember.
Observer and Dark Queen have taller artifact boxes to preserve their lower tips. Other
portrait and talent sources follow the mapping below, including original
unscrolled popups for all icons. No saved builds or awakenings are inferred.

Verification on 2026-09-14: all fourteen imports synchronized through the
existing `getHeroDetail` flow, with exact talent descriptions, core/artifact
links, and divinity order checked against the seeds. All 52 prior detail entries
and 65 prior roster entries remain unchanged. Isolated rendering of the real
hero page passed for all fourteen, including the five attached rainbow bonuses
in both sections, core previews, and I/III empty states at 18★/22★. Typecheck,
lint, and diff checks passed; tests reported **234 passed, 5 skipped** in the
shared workspace. All 138 referenced disk images validated. Authenticated live
page/image responses remain unverified: the existing local server on port 4000
redirected the hero route to the invitation screen and returned 401 for the new
artifact image without a registered session.

All supplied bottom red badges, now including Templar's **DMG Increase →
Physical DMG Boost**, match `src/data/divinities.ts` and the actual
`public/divinities/` icons. Only I/III remain missing for the fourteen candidates.

| Hero / class | Artifact | Mythic divinities, left → right | Additional gap beyond I/III |
| --- | --- | --- | --- |
| Wine Immortal / Warrior | Dragon's Secret | SPD Reduction RES → Control RES | None |
| Abyssal Queen / Mage | Sickle of Fear | HP → DMG Reduction | None; fourth core resolved by 10.57.41 AM |
| Iron Fan Princess / Mage | Palm-Leaf Fan | Ranged DMG Boost → DMG Increase | None |
| Otherworld Prisoner / Mage | Magic Oath Mask | HP → Magic DMG Boost | None |
| Wizard / Support | Dark Codex | Support ATK → Heavy Injury | None |
| Templar / Marksman | Spectral Blade | DMG Increase → Physical DMG Boost | None; 10.57.58–10.58.01 AM follow-ups |
| Warlock / Support | Demon's Cloak | Control RES → Healing Effect | None |
| Darkin Hunter / Marksman | Shadow Bow | DMG Increase → CRIT Rate | None |
| Earthbreaker / Warrior | Battle Chant Drum | ATK → Melee DMG Boost | None |
| Observer / Mage | Shadow Pendant | Heavy Injury → Ranged DMG Boost | None |
| Dark Shaman / Support | Voodoo Staff | Support ATK → Magic DMG Boost | None |
| Hellscream / Warrior | Tribe's Judgment | Melee DMG Reduction → Knockback Effect | None; Eternal Archive portrait imported |
| Bone Archer / Marksman | Blood Bow | Marksman DEF → CRIT Rate | None |
| Dark Queen / Marksman | Whispers of Death | Physical DMG Boost → DMG Reduction | None; Eternal Archive portrait imported |
| Thrall / Support | Hammer of Destruction | Knockback Effect → Anti-CRIT Rate | Already recorded, including I/III |
| Radiant Envoy / Mage | Wand of Light | DMG Increase → Magic DMG Boost | Already recorded, including approved I/III |

The six talent names and kinds below are in **0 / 2 / 5 / 8 / 12 / 16★** order,
verified against each ring. Kinds: **U** Ultimate Skill, **B** Battle Skill,
**S** Special Skill, **E** Enhance, **A** Attribute, **P** Passive. Every candidate
has six complete talent descriptions and usable original popup icons.

| Hero | Talents in unlock order |
| --- | --- |
| Wine Immortal | Storm Warrior (U) / Ground-Shaking Hit (B) / Swift Steps (E) / Wine Mist Flame (S) / Drunken Dance (A) / Earth Element (E) |
| Abyssal Queen | Abyss Roar (U) / Poisoned Blade (B) / Sonic Enhance (E) / Queen's Shriek (S) / ATK Amplification (A) / Super Sonic Wave (E) |
| Iron Fan Princess | Palm-Leaf Fan·Wind (U) / Palm-Leaf Fan·Power (B) / Windborne Steps (E) / Palm-Leaf Fan·Fire (S) / Wind Guardian (A) / Wind Fury (E) |
| Otherworld Prisoner | Flame Impact (U) / Ignite (B) / Flame Enhancement (E) / Imprint (E) / Passionate Soul (A) / Blazing Flames (E) |
| Wizard | Paralysis Potion (U) / Poison (B) / Enhance Potion (E) / Curse (S) / Energy Regen (A) / Potent Potion (E) |
| Templar | Phase Shift (U) / Psi Blade (B) / Phase Boost (E) / Mind Trap (S) / Assassin Pact (P) / Shadow Rush (E) |
| Warlock | Infernal (U) / Cataclysm (S) / Hell Harbinger (E) / Dark Word (S) / Corrupting Heart (A) / Hell Fist (E) |
| Darkin Hunter | Corrupt Chains (U) / Blight Quiver (B) / Chain Power (E) / Pierce Bolt (S) / Darkin Blood (P) / Vine Bind (E) |
| Earthbreaker | Fissure (U) / Empowered Totem (B) / Rupture (E) / Aftershock (S) / Brawny (P) / Shattered Ground (E) |
| Observer | Annihilator (U) / Ion Split (B) / Ray Boost (E) / Void Rift (S) / Void Force (P) / Ray Charge (E) |
| Dark Shaman | Serpent Ward (U) / Celestial Shock (B) / Enhanced Ward (E) / Hex (S) / Troll Bloodline (P) / Serpent Urn (E) |
| Hellscream | War Cry (U) / Bloodlust (B) / For the Tribe (E) / Earth Shatter (S) / Orc Bloodline (P) / Ancient Energy (E) |
| Bone Archer | Deathly Pact (U) / Specter Curse (B) / Flaming Arrow (E) / Rapid Fire (S) / Undead Body (P) / Revenant Pact (E) |
| Dark Queen | Dread Arrow (U) / Dark Arrow (B) / Wail of the Dead (E) / Withering Shot (S) / Ranger General (P) / Surging Energy (E) |

Source key: every item below is the exact suffix after
`gameplay/talents/Screenshot 2026-09-14 at ` and before `.png`. The narrow
no-break space before **AM** and any trailing **` 1`** are part of the filename.
Original popup columns use the same six-talent order above (and the existing
seed order for Thrall/Radiant Envoy). Continuations complete text, not icon crops.

| Hero | Ring | Six original talent popups | Talent/core continuations |
| --- | --- | --- | --- |
| Wine Immortal | 10.40.34 AM | 10.40.44 AM / 10.40.36 AM / 10.40.39 AM / 10.40.40 AM / 10.40.42 AM / 10.40.43 AM | 10.40.46 AM |
| Abyssal Queen | 10.40.52 AM | 10.41.00 AM / 10.40.53 AM / 10.40.54 AM / 10.40.55 AM / 10.40.57 AM / 10.40.59 AM | 10.40.56 AM / 10.57.41 AM |
| Iron Fan Princess | 10.41.11 AM | 10.41.19 AM / 10.41.12 AM / 10.41.14 AM / 10.41.15 AM / 10.41.17 AM / 10.41.18 AM | 10.41.13 AM / 10.41.16 AM / 10.41.20 AM |
| Thrall | 10.41.30 AM | 10.41.41 AM / 10.41.32 AM / 10.41.34 AM / 10.41.36 AM / 10.41.38 AM / 10.41.39 AM | 10.41.32 AM 1 / 10.41.36 AM 1 |
| Otherworld Prisoner | 10.41.49 AM | 10.41.57 AM / 10.41.50 AM / 10.41.52 AM / 10.41.53 AM / 10.41.54 AM / 10.41.56 AM | 10.41.50 AM 1 |
| Wizard | 10.42.03 AM | 10.42.13 AM / 10.42.04 AM / 10.42.06 AM / 10.42.07 AM / 10.42.09 AM / 10.42.11 AM | 10.42.08 AM |
| Templar | 10.42.20 AM | 10.42.29 AM / 10.42.22 AM / 10.42.23 AM / 10.42.25 AM 1 / 10.42.26 AM / 10.42.27 AM | 10.42.25 AM / 10.42.31 AM |
| Warlock | 10.42.35 AM | 10.42.44 AM / 10.42.36 AM / 10.42.38 AM / 10.42.39 AM / 10.42.41 AM / 10.42.43 AM | 10.42.40 AM / 10.42.44 AM 1 |
| Darkin Hunter | 10.42.54 AM | 10.43.03 AM / 10.42.55 AM / 10.42.57 AM / 10.42.58 AM / 10.43.00 AM / 10.43.01 AM | 10.43.03 AM 1 |
| Earthbreaker | 10.43.10 AM | 10.43.20 AM / 10.43.11 AM / 10.43.13 AM / 10.43.14 AM / 10.43.17 AM / 10.43.18 AM | 10.43.12 AM |
| Observer | 10.43.27 AM | 10.43.36 AM / 10.43.28 AM / 10.43.30 AM / 10.43.31 AM / 10.43.33 AM / 10.43.34 AM | 10.43.37 AM |
| Radiant Envoy | 10.43.43 AM | 10.43.52 AM / 10.43.44 AM / 10.43.46 AM / 10.43.47 AM / 10.43.50 AM / 10.43.51 AM | 10.43.48 AM |
| Dark Shaman | 10.43.58 AM | 10.44.06 AM / 10.44.00 AM / 10.44.01 AM / 10.44.02 AM / 10.44.04 AM / 10.44.05 AM | 10.44.03 AM / 10.44.08 AM |
| Hellscream | 10.44.16 AM | 10.44.25 AM / 10.44.17 AM / 10.44.19 AM / 10.44.20 AM / 10.44.22 AM / 10.44.24 AM | 10.44.18 AM / 10.44.21 AM / 10.44.26 AM |
| Bone Archer | 10.44.35 AM | 10.44.43 AM / 10.44.36 AM / 10.44.38 AM / 10.44.39 AM / 10.44.40 AM / 10.44.41 AM | 10.44.44 AM |
| Dark Queen | 10.44.50 AM | 10.44.59 AM / 10.44.51 AM / 10.44.53 AM / 10.44.54 AM / 10.44.56 AM / 10.44.57 AM | 10.44.52 AM / 10.44.55 AM / 10.44.59 AM 1 |

| Hero | Artifact tab | Ability popup → continuation |
| --- | --- | --- |
| Wine Immortal | 10.40.48 AM; repeated 10.41.08 AM | 10.40.49 AM |
| Abyssal Queen | 10.41.03 AM | 10.41.04 AM |
| Iron Fan Princess | 10.41.22 AM | 10.41.23 AM |
| Thrall | 10.41.43 AM | 10.41.44 AM → 10.41.45 AM |
| Otherworld Prisoner | 10.41.59 AM | 10.42.00 AM |
| Wizard | 10.42.16 AM | 10.42.17 AM |
| Templar | 10.57.58 AM | 10.58.00 AM → 10.58.01 AM |
| Warlock | 10.42.47 AM | 10.42.48 AM → 10.42.49 AM |
| Darkin Hunter | 10.43.05 AM | 10.43.06 AM → 10.43.07 AM |
| Earthbreaker | 10.43.23 AM | 10.43.24 AM → 10.43.24 AM 1 |
| Observer | 10.43.39 AM | 10.43.40 AM → 10.43.41 AM |
| Radiant Envoy | 10.43.54 AM | 10.43.55 AM → 10.43.56 AM |
| Dark Shaman | 10.44.09 AM | 10.44.10 AM → 10.44.13 AM |
| Hellscream | 10.44.31 AM | 10.44.32 AM → 10.44.33 AM |
| Bone Archer | 10.44.46 AM | 10.44.47 AM → 10.44.47 AM 1 |
| Dark Queen | 10.45.01 AM | 10.45.02 AM → 10.45.03 AM |

All fourteen candidates now have four complete gear-core descriptions.
`Screenshot 2026-09-14 at 10.57.41 AM.png` completes the earlier **10.41.00 AM**
Abyss Roar popup and reveals **Wizard's Wand·Core → Abyss Roar**:
**「Abyss Roar」 inflicts additional Magic DMG equal to 25%(75%) of ATK**.
Its gold/red bonuses agree with the original popup. Keep the unscrolled
**10.41.00 AM** capture as the icon source; the follow-up is for the core text.

| Hero | Verified core → talent links |
| --- | --- |
| Wine Immortal | Blade of Valor → Storm Warrior; Cavalier Helm → Ground-Shaking Hit; Brawler's Armor → Wine Mist Flame; Brawler's Boots → Earth Element |
| Abyssal Queen | Wizard's Wand → Abyss Roar; Arcane Hat → Poisoned Blade; Mage Robe → Queen's Shriek; Spell Tome → Super Sonic Wave |
| Iron Fan Princess | Wizard's Wand → Palm-Leaf Fan·Wind; Arcane Hat → Palm-Leaf Fan·Power; Mage Robe → Windborne Steps; Spell Tome → Palm-Leaf Fan·Fire |
| Otherworld Prisoner | Wizard's Wand → Flame Impact; Arcane Hat → Ignite; Mage Robe → Flame Enhancement; Spell Tome → Imprint |
| Wizard | Crystal Staff → Paralysis Potion; Tome of Radiance → Poison; Luminous Visor → Enhance Potion; Resonance Pendant → Curse |
| Templar | Swift Longbow → Phase Shift; Arrow Core → Phase Boost; Hunter's Cloak → Mind Trap; Crystal Pendant → Shadow Rush |
| Warlock | Crystal Staff → Infernal; Tome of Radiance → Cataclysm; Luminous Visor → Hell Harbinger; Resonance Pendant → Dark Word |
| Darkin Hunter | Swift Longbow → Corrupt Chains; Arrow Core → Blight Quiver; Hunter's Cloak → Pierce Bolt; Crystal Pendant → Vine Bind |
| Earthbreaker | Blade of Valor → Fissure; Cavalier Helm → Empowered Totem; Brawler's Armor → Aftershock; Brawler's Boots → Shattered Ground |
| Observer | Wizard's Wand → Annihilator; Arcane Hat → Ion Split; Mage Robe → Void Rift; Spell Tome → Ray Charge |
| Dark Shaman | Crystal Staff → Serpent Ward; Tome of Radiance → Celestial Shock; Luminous Visor → Hex; Resonance Pendant → Serpent Urn |
| Hellscream | Blade of Valor → War Cry; Cavalier Helm → Bloodlust; Brawler's Armor → Earth Shatter; Brawler's Boots → Ancient Energy |
| Bone Archer | Swift Longbow → Deathly Pact; Arrow Core → Specter Curse; Hunter's Cloak → Flaming Arrow; Crystal Pendant → Revenant Pact |
| Dark Queen | Swift Longbow → Dread Arrow; Arrow Core → Dark Arrow; Hunter's Cloak → Withering Shot; Crystal Pendant → Surging Energy |

Artifact links and transcription cautions for a later authorized import:

- Rainbow modifies **Storm Warrior** (Wine Immortal), **Queen's Shriek**
  (Abyssal Queen), **Curse** (Wizard), **Phase Shift** (Templar), and **Hex**
  (Dark Shaman). Thrall's already recorded rainbow still modifies Thunder Strike.
- Standalone rainbow abilities are **Wind Mastery** (Iron Fan Princess),
  **Energy Contract** (Otherworld Prisoner), **Deadly Curse** (Warlock),
  **Ghost Rain** (Darkin Hunter), **Echoing Slam** (Earthbreaker), **Area Break**
  (Observer), **Heart of Y'Shaarj** (Hellscream), **Shadows Veil** (Bone Archer),
  and **Banshee Form** (Dark Queen). Their complete endings are in the popup
  continuations above. Radiant Envoy's **Lucent Singularity** is reconfirmed.
- Templar's original talent captures already supply all four tier texts:
  purple **Refraction → Phase Shift** is in 10.42.29/10.42.31; gold **Psi Blade**
  in 10.42.22; red **Mind Trap** in the 10.42.25 pair; rainbow
  **Refraction → Phase Shift** in 10.42.31. The **10.57.58 AM** follow-up
  supplies **Spectral Blade**, clean artwork without the progress star, and
  both mythic badges. The **10.58.00 / 10.58.01 AM** popup pair reconfirms every
  tier, including the full rainbow ending: **fires 1 more Psi Blades; shield
  duration increases 2.5s**. No new contradiction or artifact gap remains.
- Preserve aliases while linking to popup titles: Wine Immortal's gold
  **Mist Flames → Wine Mist Flame**; Iron Fan Princess's Arcane Hat says
  **Palm-Leaf Fan·Force → Palm-Leaf Fan·Power**; Templar's **Refraction → Phase
  Shift**; Dark Shaman's Crystal Staff says **Serpent Wards → Serpent Ward**.
  Templar's red text mentions **Illusory Nightmare**; do not invent another
  talent or change the Mind Trap link. Strip only the final `·Core` from
  **Arrow Core·Core**, retaining the gear name **Arrow Core**.
- Wine Immortal's rainbow extends Storm Warrior **by 10** without a displayed
  unit. Iron Fan Princess's ultimate says **4 segments of 45% Magic DMG**,
  with no ATK basis, and its Wizard's Wand shows **13%(40%) of ATK**. Wizard's
  Paralysis Potion literally deals **3% of ATK**; its Poison and Curse cores
  show **3%(10%)**. These are visible source wording, not clipped passages.
- Abyssal Queen's Mage Robe continuation is complete at **10.40.56 AM**:
  Queen's Shriek also drains **2%(6%)** of current HP, capped at
  **400%(500%)** of her ATK. The separate **10.57.41 AM** follow-up supplies
  Wizard's Wand as the fourth core.
- Templar's Hunter's Cloak shows **1(3%)%** and **20(60%)%**; Swift Longbow
  shows **4.5(3.5)%**; Arrow Core shows **30(90%)%**. Preserve the displayed
  parentheses instead of normalizing or recalculating them.
- Warlock's Hell Harbinger says **150% Magic DMG per second**, and Deadly Curse
  says **40% Magic DMG per second**, without an ATK basis. Dark Word's healing
  wording is **65% of the Magic DMG per second**. Darkin Hunter's Ghost Rain
  literally says **reducing enemy Healing by 50% and Energy Regen by 25%**.
- Hellscream's Heart of Y'Shaarj says its **5s** duration is extended by **1s**
  per enemy death, **up to a maximum of 2s**; preserve that wording rather than
  deriving a total duration. Dark Queen's Arrow Core increases DMG by
  **100%(300%)**, with no ATK basis stated in that core.
- Original/scroll suffixes differ: Templar's **10.42.25 AM 1.png** is the
  unscrolled Mind Trap icon source; the filename without ` 1` completes its
  core. Earthbreaker's **10.43.24 AM 1.png** and Bone Archer's
  **10.44.47 AM 1.png** are artifact continuations. Dark Queen's
  **10.44.59 AM.png** is the original Dread Arrow popup; the ` 1` file completes
  the gold bonus and Swift Longbow. No recapture is needed for those endings.

#### Swordmaster (game, 2026-09-14, 12.58 PM)

The owner's eleven **12.58.22–12.58.40 PM** screenshots supply **Swordmaster
(Warrior)**, artifact **Devil Fruit**, and the bottom red **ATK → Melee DMG
Boost** badges, visually matched to the existing divinity catalog. The existing
Mythic Archive portrait is retained. All six talents, four cores, and four
artifact abilities are recorded; **Awakening I (18★) and III (22★)** were not
supplied or excluded and remain unrecorded. This completes detail-entry coverage
for the 67-hero roster, with the documented evidence gaps still applying.

| Talent | Kind | Unlock | Artifact bonus | Core |
| --- | --- | --- | --- | --- |
| Infernal Oni Slash | Ultimate Skill | 0★ | — | Blade of Valor: Physical DMG equal to 60%(180%) of Attack |
| 36 Pound Cannon | Battle Skill | 2★ | Purple: after silence ends, energy recovery speed −40% for 5s | — |
| Enhanced Slash | Enhance | 5★ | — | Cavalier Helm: each slash adds DMG equal to 1.5%(4.5%) of target's lost HP, capped at 150%(450%) of Swordmaster's Attack |
| Rashomon | Special Skill | 8★ | Gold: reflect DMG +30%, duration +2s; rainbow: restores 13% max HP, barrier grants +35% energy recovery speed and +0.8% HP regeneration per second | Brawler's Armor: Reflect DMG +10%(30%) |
| Armament Haki | Passive | 12★ | — | — |
| Path of Asura | Enhance | 16★ | — | Brawler's Boots: True DMG equal to 20%(60%) of Attack, duration +1(3) s |

**Great Chiliocosm** is Devil Fruit's standalone **red** ability. After 13s on
the battlefield, Swordmaster unleashes an unavoidable sword aura storm; targets
take 27% increased DMG from him, and his own silence duration is reduced by 60%
until battle ends. **Rashomon's rainbow bonus is talent-attached**, alongside
gold, and appears in both Talents and Artifacts. The Cavalier Helm description
uses **Enhance Slash**; preserve that wording while linking to **Enhanced Slash**.
Full source descriptions are in `src/data/hero-details.ts`.

All filenames below are under `gameplay/talents/`, with prefix
`Screenshot 2026-09-14 at ` and suffix ` PM.png` unless explicitly stated.
The narrow no-break space and ` 1` suffix are significant.

- Ring: **12.58.35** confirms clockwise 0/2/5/8/12/16★ order.
- Original talent popups in that order: **12.58.31 / 12.58.22 / 12.58.24 /
  12.58.25 / 12.58.28 / 12.58.29**. These supply the six icon crops.
- **12.58.26** is Rashomon's scrolled continuation, completing its rainbow
  bonus and Brawler's Armor core; do not use it for the talent icon.
- Artifact tab: **12.58.37**, supplying the name and two mythic divinities.
- **Screenshot 2026-09-14 at 12.58.40 PM 1.png** is the original artifact
  popup, providing the full-color Devil Fruit crop, purple/gold tiers, and
  complete red ability. **12.58.40 PM.png** is the scroll with complete rainbow
  text, agreeing with Rashomon's continuation.

Verification on 2026-09-14: Swordmaster synchronized through the existing
`getHeroDetail` flow; stored talent descriptions, core/artifact links, and
divinity order match the seed. Isolated rendering of the actual hero page
passed for names/descriptions, core previews, I/III empty states at 18★/22★,
all three attached bonuses in both sections, and standalone red only in
Artifacts. All seven new crops were visually checked and all ten referenced
portrait/talent/artifact/divinity PNGs validated. All **596** previously existing
PNGs remain byte-identical, so no asset-version bump is needed. Typecheck, lint,
formatting of the seed, and diff checks passed; tests reported **213 passed,
5 skipped**. Authenticated live page/image responses remain unverified: the
local port-4000 hero route redirects to the invitation screen and the artifact
request returns 401 without a session. No access settings were changed.

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
| Shadow Fiend | I | Soul Reaping | Every hero death instantly restores 100 Energy and grants 30% ATK SPD for 6s; the buff refreshes instead of stacking. | 8.54.42 |
| Shadow Fiend | III | Soul Borrowing | Gains an additional 2.5% ATK SPD and 2.5% ATK for every enemy on the battlefield. | 8.54.44 |
| Necromancer | I | Sadist's Heart | Every enemy killed (excluding summons) grants 3% Ranged DMG Reduction and 0.3% HP Regen per second, up to 5 stacks. | 9.19.39 |
| Necromancer | III | Necro Possession | On entering battle, grants the highest-ATK ally (excluding self) 25% Ranged DMG Reduction, decaying to 10% after 15s; the screenshot says it "lasts until the end". | 9.22.05 |
| Thrall | I | Kinetic Field | While Thrall is alive, enemies except illusions and summons have movement speed −10% and control resistance −30%. | 9.27.26 |
| Thrall | III | Guardian Purification | Casting any skill randomly dispels some debuffs from one ally and restores HP equal to 50% of "Thal's" ATK every second for 6s, with an 8s cooldown. | 9.27.29 |
| Jungle Envoy | I | Force of Nature | Enemy ATK −15% for 12s on entry, then gradually diminishes over 18s, ending at 30s. | 11.33.24 |
| Jungle Envoy | III | Tranquil Redemption | Lightning Storm or Demonic Edict heals the lowest-HP ally for 130% of own ATK. | 11.33.25 |
| Radiant Paladin | I | Sacred Body | Each 10% max HP lost adds 3% Physical RES and 3.5% Injured Energy Regen. | 11.33.58 |
| Radiant Paladin | III | Wings of Purity | First HP drop below 40% grants 4s Physical DMG immunity and 5% max HP healing per second. | 11.34.00 |
| Silence | I | Blade Break | Wisdom Blade has a 40% chance to hit two front enemies; four attacks on the same target reduce DEF by 10% for 5s. | 11.34.28 |
| Silence | III | Soul Sustenance | Each fallen ally grants 4.5% ATK and DEF until battle ends. | 11.34.29 |
| Gunslinger | I | Swift Victory | Entry grants 40% Energy Recovery SPD for 25s, gradually diminishing. | 11.34.51 |
| Gunslinger | III | Frenzy | Each Snipe adds 10% ATK and ATK SPD until battle ends, up to two stacks. | 11.34.53 |
| Dark Knight | I | Undead Guard | Entry grants all allies 10% Magic RES; the description calls it "Undead Guardian". | 11.35.22 |
| Dark Knight | III | Death Pact | Fatal damage delays death by 3.5s; cannot recover energy during this time. | 11.35.24 |
| Arcane Saint | I | Gourd Guard | Entry protects the lowest-DEF ally, increasing Energy gained from damage taken by 80% until that unit dies. | 11.35.52 |
| Arcane Saint | III | Nature's Power | Each Golden Holy Bloom adds 8% Physical and Magic RES to all allies, up to two stacks. | 11.35.55 |
| Witch Dictator | I | Dark Faded | Enemies take 5% more Magic DMG; Basic ATKs have a 30% chance to freeze for 1.5s. All own freezes drain 30 enemy energy (3s CD). | 11.50.20 + 11.51.47 |
| Witch Dictator | III | Dark Ritual | Entry consumes 3% current maximum HP for 100 energy (10s CD); cannot activate below 30% HP. | 11.36.22 |
| Silver Warrior | I | Lone And Brave | First HP drop below 50% grants immunity to certain control/slow effects for 7.5s. | 11.36.52 |
| Silver Warrior | III | Killing Intent | Godslayer Strike's final hit stuns for 4s and reduces Dawn Slash cooldown by 1.5s. | 11.36.54 |
| Holy Healer | I | Eudaemon Blessing | Enemy energy skills shield the weakest ally for 200% of Holy Healer's ATK (12s CD). | 11.37.31 |
| Holy Healer | III | Conviction | Every 8s, reduces the highest-damage enemy's Energy Regen SPD by 55% for 5s. | 11.37.33 |

Awakening I unlocks at **18★** and III at **22★** (owner-confirmed).
Necromancer's Awakening I is recorded from the follow-up 9.19.39 AM screenshot.
The repeated III captures (9.07.47, 9.20.08, 9.22.05 AM) all end with "until the
end"; preserve that wording rather than adding an inferred continuation or an
ellipsis. Its earlier 9.07.45 AM capture has the
**IV** tab selected, not I: **Emergency Healing** — "When self or an ally's HP
drops below 30%, immediately restores HP equal to 120% of ATK. (CD: 13s)"
This is recorded here once as **Support Awakening IV**, following the owner's
class-wide II/IV rule; it is not a hero-specific I skill. Shared class awakening
data/display is not implemented yet. II and other classes' IV remain unrecorded.
Thrall's III is inactive in the screenshot, but its full description is visible.
The game spells his name "Thal" in that description; the transcription preserves it.

#### Radiant Envoy awakening reference (owner-approved MR-UK guide)

`gameplay/talents/image.png` is an MR-UK compendium excerpt, not a Hero Awaken
screen. Its first and third entries are marked **Unique Skill**; the second and
fourth are **Mage Common Skill**. On 2026-09-13, the owner explicitly chose to
use this guide for the two unique skills as I/III in that order, with `image.png`
retained as their source. Additional awakening screenshots are not required for
this update. These entries are guide-sourced, not independently checked in-game;
any later owner corrections or in-game screenshots override the guide.

- **Radiant Glow (I, 18★):** Final Spark, Light Binding, or Prismatic Barrier
  dealing damage marks an enemy for 4s; marked targets take 11% increased damage
  from Radiant Envoy, and the mark cannot be dispelled.
- **Holy Light Field (III, 22★):** 3s after entry, dispels all negative status
  effects from the ally with the lowest HP percentage and grants status immunity
  for 20s. It can trigger again when self HP drops below 50%.
- **Spell Barrier (Mage Common Skill, second entry):** a single hit exceeding
  17% Max HP reduces damage taken by 10% for a short duration (7s cooldown).
- **Psychic Surge (Mage Common Skill, fourth entry):** the first HP drop below
  40% immediately restores 90 Energy and grants immunity to most negative status
  and control effects for 3s.

The two common skills remain here as unverified class references and are not
copied into Radiant Envoy's hero-specific awakening data.

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
"All Physical RES" is **Physical RES**. `kind` is the app's display category,
initially taken from the popup title (minus "Divinity"). Owner corrections take
precedence: **Knockback Resist** and **SPD Reduction RES** belong to **Knockback**;
**Heavy Injury**, **Healing Effect**, and **Receive Healing** belong to **Healing**
(owner, 2026-09-13). **CRIT DMG Reduction** and **Anti-CRIT Rate** belong to
**DMG Reduction**; the remaining **RES** category is named **Control**, containing
**Anti-Control Rate** and **Control RES** (owner, 2026-09-14).

Divinities have rarities; the app only includes **mythic (red)** ones (owner). The
30 mythic divinities read from the owner's popups (`gameplay/divinities/`, 131 shots with
duplicates; produced by `scripts/slice-divinities.py`):

| Kind          | Divinities (stat rows)                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| ATK           | ATK, Mage ATK, Support ATK, Warrior ATK (flat numbers)                                                      |
| DEF           | DEF, Marksman DEF (flat)                                                                                    |
| HP            | HP (flat)                                                                                                   |
| DMG Increase  | DMG Increase, Physical DMG Boost, Magic DMG Boost, Melee DMG Boost, Ranged DMG Boost (%)                    |
| DMG Reduction | DMG Reduction, Physical RES, Magic RES, Melee DMG Reduction*, Ranged DMG Reduction, CRIT DMG Reduction, Anti-CRIT Rate (%) |
| CRIT          | CRIT Rate, CRIT Damage (%)                                                                                  |
| Control       | Anti-Control Rate, Control RES (%)                                                                         |
| Knockback     | Knockback Effect, Knockback Resist, SPD Reduction RES (%)                                                  |
| Healing       | Heavy Injury, Healing Effect, Receive Healing (%)                                                         |
| SPD Boost     | ATK SPD (%)                                                                                                 |

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

### Pets (owner-defined, 2026-09-13)

The pet catalog records **only each pet's name and icon**. Icons come from the
owner's `gameplay/pets/` screenshots. Pet stats, skills, companion bonuses,
and levels are outside the requested scope. Pets can be assigned to individual
heroes within a lineup; each hero can have multiple pet selections.

### Relics (owner-defined, 2026-09-13)

The relic catalog records **only each relic's name and icon**, as requested by
the owner. Names and icons come from `gameplay/relics/`; enhancement levels,
attributes and star effects are not part of this catalog. Relics can be assigned
to individual heroes within a lineup, with multiple selections per hero.

The eight supplied Relic Archive popups identify **Night Twinblades**, **Charge
Shield**, **Spiked Armor**, **Soulcalm Gem**, **Boots of Haste**, **Silverblade**,
**Pendant of Purity**, and **Arcane Cloak**. The displayed `+15` is omitted from
their catalog names. `gameplay/relics/image.png` supplies the eight clean icon
tiles, matched to the 12.57.40–12.58.16 PM popups.

### Fishes (owner-defined, 2026-09-13)

The fish catalog and dedicated Fishes page must show each fish’s icon, name,
base stats, special stats, and where to get it (owner, 2026-09-15).
Base stats are ATK, HP, DEF, and class-specific ATK/HP; all other bonuses
are special stats (owner, 2026-09-15).
Baits belong in the database; each fish has its corresponding bait, or none
when not applicable (owner, 2026-09-15).
Do not show collection information on fish cards (owner, 2026-09-15).
Show fishes with special stats first (owner, 2026-09-15).
Keep the 16 specific CSV bait links; all other fishes have no assigned bait.
Category compatibility alone does not create a fish-specific link (owner, 2026-09-15).

Lineups include fishes. The owner requested a fish catalog in the database and
fish selection in the lineup builder. Fish selections belong to the lineup.
The owner supplied seven `gameplay/fishes/Fish Guide - <Area>.csv` sheets with
**130 fishes**: Gold Coast (21), Moonlight Canyon (16), Snowy Mountain (18),
Desert Beach (17), Frost Land (19), Jungle Lakes (19), and Idyllic Paradise (20).
Each row records a name, type (Small / Medium / Large / Aquatic), collection,
up to three stat names, and optional bait. Area comes from the sheet filename.
Preserve the sheet's names and stat wording, trimming whitespace and treating
`-` as unrecorded. No stat values have been specified.
Fish selection is grouped into **Small, Medium, Large, and Aquatic**. Each category
can contain multiple distinct fishes, and each selected fish has a quantity of
**1–4** (owner, 2026-09-13). The limit is per fish, not per category. Existing fish
selections start at quantity 1; editing and cloning preserve quantities.
Hovering over a fish must show where to get it (owner, 2026-09-14). Fish names in
the picker and saved lineups open a location preview on hover or press, showing
the recorded area and optional bait from the owner's sheets.
Lineups and the builder must show fish icons and expanded fish information in
hover popovers (owner, 2026-09-15), including base stats, special stats,
category, location, and assigned bait.
Fish items have equal widths and stay on one line without layout jumps
(owner, 2026-09-15).
The owner confirmed that fish selections use this **separate fish list**;
the earlier fishing collectibles sheet must not be imported as fishes.

### Lineups (game)

A battle lineup is **5 heroes**. Conventional wisdom (web) is one of each role plus a
flex pick, but the whole point of this app is to record the owner's better answers.

Lineups can be **partially saved** and completed later (owner, 2026-09-14), but
the owner clarified that saving requires **at least five heroes**. The app has
five slots, so all five must contain distinct heroes before saving. A name is
also required; builds, pets, relics, fishes, and notes can be left empty.

There is **no "Front 1 / Front 2 / Back" slot naming** in the game (owner, 2026-09-12).
The app labels slots plainly _Slot 1–5_ until the owner describes the real formation.

Clicking a slot in the lineup builder opens the hero pool in a dialog. The name
and notes use the full page content width below the lineup and fish controls
(owner, 2026-09-14).

Hero cards in saved lineup lists, lineup detail pages, and the lineup builder
(both the hero picker and selected slots) must not display divinities
(owner, 2026-09-13).

Saved lineups are editable, including their name, notes, heroes, and each hero's
pet/relic assignments (owner, 2026-09-13). A hero can be assigned one or more pets
and one or more relics within that lineup. Assignment controls and selected icons
belong inside the hero card. Attached pets and relics display as icons only,
without visible item names; retain the Pets and Relics category labels on lineup
details (owner clarification, 2026-09-14). Names remain
available through accessible image labels and on hover. Assignments are specific
to a lineup, not a hero's global catalog data.
Pet/relic pickers use floating multi-select dropdowns with a fixed-height selected
icon preview, so opening the options or changing selections does not shift the
surrounding hero cards (owner, 2026-09-13).
Each lineup hero may also be assigned one of that hero's saved builds. Hovering
over a build shows its recorded rune/weapon attributes, priorities, and cores in
a popover; hovering over a core shows its linked skill in a popover (owner,
2026-09-13). Build selection uses a floating dropdown without shifting cards.
Build names in lineup cards and the editor show an **eye icon** beside the name
to make their hover/tap stats preview discoverable (owner, 2026-09-13).
The lineup details toolbar places Edit, Delete, and Clone on the left, in that
order. Share appears in the page title row. There is no New lineup button
(owner, 2026-09-14).
Lineups also include fishes, selected from a database catalog in the builder
(owner, 2026-09-13).
The owner also requested a **Clone** option. It opens an editable copy with the
same formation, build references, pets, relics, fishes, and notes. The name gets
a ` (copy)` suffix; saving creates a new lineup, and Cancel returns to the source.
Clone requires a signed-in admin, as do creating and editing lineups. Localhost
does not grant feature access (owner, 2026-09-14).

**Copy link with IC** generates an invitation scoped to that lineup. A device
that redeems it can access only that lineup; redeeming codes for more lineups
adds those lineups to the same device's access (owner, 2026-09-14). Standalone
invitations retain full-library access. Scoped devices see their invited lineups
in the lineup list; public URL access remains independent.
Preserve the normal desktop and mobile navigation links for lineup-scoped
devices; page access checks enforce their restrictions (owner, 2026-09-14).

### Creator support (owner, 2026-09-14)

The About page offers sponsorship through an in-game top-up for ✨Cmajor✨.
Use the owner's supplied [top-up link](https://pay.maxngame.com/miniheroes_global/#/?role_id=15298308&lang=en)
and display player ID **15298308** alongside the sponsorship button.

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

- 2026-09-15 — Fish items in lineups and the builder should have the same width.

- 2026-09-15 — Fish items in lineups and the builder must stay on one line
  without UI jumps.

- 2026-09-15 — Show fish icons in lineups and the builder, with fish information
  in a popover when hovered.

- 2026-09-15 — Sort the fish catalog with fishes that have special stats first.

- 2026-09-15 — Keep the 16 fish-specific bait links from the CSVs and show
  None for every other fish; do not assign all category-compatible baits.

- 2026-09-15 — Fish cards do not need collection information.

- 2026-09-15 — Review the newly added bait screenshots, add baits to the
  database, and give each fish its corresponding bait, or none when not applicable.

- 2026-09-15 — Fish base stats are ATK, HP, DEF, and class-specific ATK/HP.
  Other bonuses (including damage reduction, healing, and knockback) are special stats.

- 2026-09-15 — Update the fish database and add a Fishes page. Each fish should
  have an icon, name/label/title, base stats, special stats, and where to get it.

- 2026-09-15 — Sort the hero pool by rarity, then class. Retain the existing
  saved-build-first grouping and use name to break ties.

- 2026-09-14 — Move Share to the same row as the lineup title, superseding its
  placement on the right of the toolbar.

- 2026-09-14 — Remove New lineup from the lineup details toolbar; place Edit,
  Delete, and Clone on the left and Share on the right.

- 2026-09-14 — Keep the Pets and Relics labels; only the attached item names
  should be hidden, leaving their icons visible.

- 2026-09-14 — Rearrange the toolbar buttons on lineup details.

- 2026-09-14 — In hero lineups, show only the icons of pets and relics attached
  to each hero.

- 2026-09-14 — On the build page, clicking a lineup slot should open the hero
  pool in a dialog. Rearrange the layout so the other input fields use the full width.

- 2026-09-14 — Add an option to clone a saved hero build.

- 2026-09-14 — The owner will revisit the game and capture the actual Vietnamese
  labels. They requested a separate Markdown checklist identifying which in-game
  areas to screenshot so the app translations can be verified against the game.

- 2026-09-14 — Lineups can be partially saved.
- 2026-09-14 — Clarification: saving a lineup requires at least five heroes.
  Partial saving refers to optional details and assignments, not fewer heroes;
  this corrects the earlier assistant interpretation that one hero was enough.

- 2026-09-14 — The owner requires English/Vietnamese localization for hero
  names, fish names, and all game-related labels, not only the surrounding
  interface. They suggested storing translation keys in the database and
  resolving them through i18n. Preserve screenshot source text and stable record
  IDs while localizing display names.

- 2026-09-14 — The About page should accept sponsorship via in-game top-up.
  The owner supplied `https://pay.maxngame.com/miniheroes_global/#/?role_id=15298308&lang=en`
  as the sponsorship destination.

- 2026-09-14 — Preserve the navigation bar when adding lineup-scoped invitation
  access; do not reduce its regular links to only Lineups.

- 2026-09-14 — Heroes that have a saved build should appear first in the hero pool.

- 2026-09-14 — Invitation codes generated by sharing a lineup link with IC
  grant that device access only to that lineup. A device receiving invitation
  codes for multiple lineups can see all of those invited lineups. The owner
  reaffirmed this as the main requirement for the unstaged changes and requested
  an end-to-end review and completion of the flow.

- 2026-09-14 — A hero's portrait should indicate when a saved build is available
  for that hero. Keep the build's hammer icon and add a thicker green checkmark
  with no background behind the check; both scale to the portrait. The hammer
  badge's background should contrast more strongly with the hero artwork.
  Hovering the badge must show a styled tooltip, not an HTML title.

- 2026-09-14 — The owner's eleven **12.58.22–12.58.40 PM Swordmaster**
  screenshots establish the six talents and four linked cores in the reference
  above, **Devil Fruit**, and mythic **ATK / Melee DMG Boost** in left/right
  order. Red **Great Chiliocosm** is standalone; gold and rainbow both modify
  **Rashomon**. Cavalier Helm's **Enhance Slash** wording refers to the talent
  titled **Enhanced Slash**. The invoked add-hero skill authorizes importing
  these supplied details and screenshot crops with the existing Archive
  portrait. Awakening I/III were not supplied and remain unrecorded.

- 2026-09-14 — Feature access is determined by admin status; localhost is no
  longer an access condition. Editing, invitation generation, and public URL
  management require a signed-in admin in every environment.

- 2026-09-14 — After reviewing the 10.40–10.45 AM batch and its
  10.57–10.58 AM/Archive follow-ups, the owner invoked
  **add-mini-heroes-hero** and requested **multiple agents**, authorizing the
  fourteen screenshot-backed detail imports and Hellscream / Dark Queen's
  Eternal roster additions. No Awakening I/III screenshots were supplied;
  preserve those unknown stages while importing the verified content.

- 2026-09-14 — **10.57–10.58 AM and Archive follow-up review:** the owner
  supplied five new images. **10.57.41 AM** completes **Wizard's Wand → Abyss
  Roar**, adding Magic DMG equal to **25%(75%) of ATK**. Templar's
  **10.57.58 AM** Artifact tab establishes **Spectral Blade** and mythic
  **DMG Increase / Physical DMG Boost**, left/right; **10.58.00 / 10.58.01 AM**
  reconfirm all four abilities against the previous talent popups.
  `gameplay/heroes/image copy 9.png` explicitly shows the **Eternal 2/2**
  Archive section with **Hellscream (Warrior)** and **Dark Queen (Marksman)**,
  supplying both portrait sources and confirming a fourth Archive rarity.
  All fourteen candidates now have complete non-awakening evidence; only
  **I (18★) and III (22★)** remain missing, with no exclusion applied.
  Documentation-only review: no roster, detail seed, portrait, or database import.
- 2026-09-14 — **Readiness review of the 10.40.34–10.45.03 AM batch:** the
  owner's 179 screenshots establish the identities, talent names/kinds/order,
  core links, artifact abilities, and mythic divinities in the review section
  above. Ten existing-roster candidates have complete non-awakening evidence;
  Abyssal Queen needs the fourth core below Abyss Roar, and Templar needs its
  Artifact tab (all four ability texts are already visible in talent popups).
  Hellscream (Warrior) and Dark Queen (Marksman) have complete supplied combat
  details but no Archive portrait/roster evidence. All fourteen new candidates
  lack Awakening I/III, which were not excluded. Thrall and Radiant Envoy agree
  with their existing detail entries, including previously recorded awakenings.
  This records a review only; no seed, public image, or database content changed.
- 2026-09-14 — After the readiness review and Snowoman follow-ups, the owner
  authorized importing the reviewed hero details with
  **`$add-mini-heroes-hero use multiple agents`**. This covers Snowoman, Bamboo
  Hat, Fire Sorceress, Red Hood, Little Goblin, Radiant Angel, Diva, Little Deer,
  Lucifer, Captain Pilot, Li Bai, and Lady Pan. Record the supplied talents,
  linked cores, artifact abilities/artwork, and mythic divinities; keep their
  existing Archive portraits. Awakening I/III have not been supplied or excluded
  and remain unrecorded.
- 2026-09-14 — **Authorized 9.58–10.02 AM import:** recorded the twelve heroes'
  72 talents, 48 linked cores, 48 artifact abilities, and 24 mythic divinity links
  from the source tables above, including Snowoman's 10.10 AM follow-ups. Generated
  72 talent icons and 12 artifact images; all 412 existing PNGs stayed byte-identical.
  Source wording is preserved, including Li Bai's **3% of ATK** Sword Beam and
  Little Deer's **30%(100%)** Nourishment core. Awakening I/III remain unrecorded.
- 2026-09-14 — **Snowoman follow-up review:** the owner added
  `Screenshot 2026-09-14 at 10.10.23 AM.png` and
  `Screenshot 2026-09-14 at 10.10.48 AM.png`. The first confirms **Blizzard**
  as Ultimate Skill: **3 waves**, each dealing **80% of ATK as Magic DMG** to
  enemies within range. Its fourth core is **Crystal Staff·Core → Blizzard**:
  increases Magic DMG by **20%(60%) of Attack**. The complete gold bonus matches
  the earlier artifact popup. The earlier **9.58.26 AM** ring supplies the full
  icon because the new popup's top is scrolled. The second new screenshot
  reconfirms **Tome of Radiance → Ice Blast**, **50%(150%) of Attack** as extra
  Magic DMG. Snowoman's talent/core gaps are resolved; all twelve candidates in
  the 9.58–10.02 AM batch now have complete non-awakening evidence. **I (18★)
  and III (22★)** remain missing for all twelve. Documentation only; no import.

- 2026-09-14 — **Readiness review of the 9.58.26–10.02.38 AM batch:** the
  owner's 162 screenshots cover twelve new detail candidates (Snowoman,
  Bamboo Hat, Fire Sorceress, Red Hood, Little Goblin, Radiant Angel, Diva,
  Little Deer, Lucifer, Captain Pilot, Li Bai, Lady Pan) and three already
  recorded heroes (Witch Dictator, Silver Warrior, Arcane Saint). The identities,
  artifacts, left/right mythic divinities, talent order/kinds, core links, exact
  source files, aliases, and transcription cautions are recorded in the
  **September 14 9.58–10.02 AM screenshot review** section above. Eleven new
  candidates have complete non-awakening evidence; Snowoman lacks the Blizzard
  popup and fourth core. All twelve lack I/III; this review does not inherit
  another batch's exclusion. Existing heroes' supplied content agrees with
  their seeds. This review updates documentation only, without importing data.
- 2026-09-14 — The owner's **9.58.32 AM** Snowoman screenshot labels
  **Glorious Aura (8★)** as **Aura**: restore **40 energy to all allied heroes
  every 3s**. Its Resonance Pendant adds **5(15) Energy each time**. Ice Blast
  (2★) is Special Skill; Bone-Chilling Cold (5★) has Luminous Visor. The
  **9.58.43 AM** artifact popup establishes standalone purple **Ice Seal
  Technique** and the **Ice Blast Technique → Ice Blast** title alias.
- 2026-09-14 — The same review establishes Fire Sorceress's red/rainbow
  **Blazing Fire** as one standalone artifact ability across two tiers;
  Bamboo Hat's **Qi Consolidation Mantra → Qi Mantra** and Captain Pilot's
  **Suppressive Shooting → Suppressive Shoot** aliases; and the complete
  scrolled **Hero's Journey / Random Snack** descriptions. Preserve Li Bai's
  displayed **3% of ATK** on Sword Beam, Red Hood's **within 2 upon explosion**
  without an inferred unit, and the other source-specific values noted above.

- 2026-09-14 — Hovering over a fish should show **where to get it**.

- 2026-09-14 — The owner revised the earlier divinity grouping: **CRIT DMG
  Reduction** ("crit res") and **Anti-CRIT Rate** now belong to **DMG Reduction**.
  This supersedes the earlier move into CRIT; **Control** remains the category name.

- 2026-09-14 — Divinity categories: move **CRIT DMG Reduction** and
  **Anti-CRIT Rate** into **CRIT**, and rename **RES** to **Control**.

- **2026-09-14:** The owner authorized adding the reviewed new heroes and **Aura**.
  Import the thirteen 8.35–8.45 AM detail candidates, including Jungle Archer's
  9.01 AM follow-ups, with their verified talents, cores, artifacts, and divinities.
  Aura is the talent kind on Bloodthirsty Curse and ATK SPD Aura. No I/III
  screenshots were supplied; those stages remain unrecorded in this import.

Everything the owner says about the game gets appended here, dated, the moment it
is said. These override anything marked (web).

- 2026-09-13 — Fishes must be categorized as **Small, Medium, Large, and Aquatic**. Each category can contain more than one fish, and each fish can have multiple copies, up to **4**.

- 2026-09-13 — Lineups should have **fishes**. Add fishes to the database and to the lineup builder.
- 2026-09-13 — Use a **separate fish list** for the fish catalog, not the fishing collectibles in `Fish Guide - Collectibles.csv`.
- 2026-09-13 — The owner supplied the separate fish list: seven area CSVs in `gameplay/fishes/`, containing 130 fishes with their types, collections, stat names, and bait.

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
- 2026-09-13 — The owner's new talent screenshots show **Shadow Fiend** (Marksman · DPS · Eternal): **Soul Requiem** (Ultimate), **Soul Burn** (Battle, 2★), **Ghost Curse** (Enhance, 5★), **Destructive Gloom** (Special, 8★), **Haunted** (Passive, 12★), **Spiteful Curse** (Enhance, 16★). The artifact is **Soul Mask**; its two red divinity icons match the existing **Physical DMG Boost** (left) and **CRIT Damage** (right) catalog icons.
- 2026-09-13 — Shadow Fiend's **Soul Reaping** (Awakening I) restores 100 Energy and grants 30% ATK SPD for 6s whenever any hero dies; the buff does not stack but its duration refreshes on each trigger. **Soul Borrowing** (Awakening III) grants 2.5% ATK SPD and 2.5% ATK per enemy on the battlefield.
- 2026-09-13 — Shadow Fiend's talent popups show a purple artifact bonus on **Soul Burn**, and both gold and red bonuses on **Destructive Gloom**. The visible cores are **Arrow Core** (Soul Burn), **Hunter's Cloak** (Ghost Curse), and **Swift Longbow** (Soul Requiem). The red bonus description is cut off after "upon entering"; the full artifact popup, rainbow ability, and any further core panel are not in this screenshot batch.

- 2026-09-13 — The owner requested **cores in hero builds**, alongside rune and weapon attributes.
- 2026-09-13 — The owner's new screenshots show **Necromancer** (Support · Heal · Eternal): **Death Pulse** (Ultimate), **Reaper Scythe** (Battle, 2★), **Dark Pulse** (Enhance, 5★), **Ghost Shield** (Special, 8★), **Soul Offering** (Passive, 12★), **Necro Arts** (Enhance, 16★). Its artifact is **Ghostlight Bone**; the red divinity badges match **Healing Effect** (left) and **CRIT DMG Reduction** (right).
- 2026-09-13 — Necromancer's visible cores are **Tome of Radiance** (Reaper Scythe), **Luminous Visor** (Ghost Shield), and **Resonance Pendant** (Necro Arts). Luminous Visor's description cuts off after "and Energy Regen"; no fourth core or full artifact ability popup is supplied.
- 2026-09-13 — Necromancer's **Necro Possession** (Awakening III, 9.07.47 AM) grants the highest-ATK ally other than self 25% Ranged DMG Reduction on entering battle, decaying to 10% after 15s; its duration text cuts off after "until the end". The 9.07.45 AM screenshot shows **Awakening IV: Emergency Healing**, not I: self or an ally falling below 30% HP triggers healing equal to 120% of ATK (13s cooldown). Under the owner's class-wide rule, this belongs to Support IV, not Necromancer I. Awakening I is not in this batch.

- 2026-09-13 — The owner's follow-up Necromancer screenshots confirm **Awakening I: Sadist's Heart** (9.19.39 AM): every enemy killed, excluding summons, grants 3% Ranged DMG Reduction and 0.3% HP Regen per second, stacking up to 5 times. The repeated **Necro Possession** III captures (latest 9.22.05 AM) all show the ending "lasts until the end"; the app preserves those exact words.
- 2026-09-13 — The scrolled **Luminous Visor** core panel (9.21.52 AM) completes its Ghost Shield bonus: HP Regen +0.2%(0.6%) and Energy Regen +2%(6%).
- 2026-09-13 — Ghostlight Bone's artifact popup (9.19.54 AM) confirms the purple, gold, and red bonuses and names its rainbow skill **Exhaustion Aura**: it releases upon entering battle, reducing all enemies' DMG by 12% and Energy Regen by an obscured value. The Max Quality footer covers the remaining description; it must not be invented.

- 2026-09-13 — The owner's new screenshots show **Thrall** (Support · Heal · Eternal): **Electric storm** (Ultimate), **Thunder Strike** (Battle, 2★), **Enhanced Storm** (Enhance, 5★), **Guardian Rune** (Special, 8★), **Orc Soul** (Passive, 12★), **Electric Overload** (Enhance, 16★). Artifact: **Hammer of Destruction**. Its red divinity badges match **Knockback Effect** (left) and **Anti-CRIT Rate** (right).
- 2026-09-13 — Thrall's four core panels show **Crystal Staff** (Electric storm), **Tome of Radiance** (Thunder Strike), **Luminous Visor** (Guardian Rune), and **Resonance Pendant** (Electric Overload). Its rainbow artifact tier is a bonus to **Thunder Strike**, alongside its gold bonus; rainbow does not always create a standalone skill.
- 2026-09-13 — Thrall's **Kinetic Field** (Awakening I) reduces enemy movement speed by 10% and control resistance by 30% while Thrall is alive, excluding illusions and summons. **Guardian Purification** (Awakening III) triggers on casting any skill, randomly dispels some debuffs from one ally, and heals for 50% of "Thal's" ATK each second for 6s (8s cooldown); the name spelling is from the screenshot.

- 2026-09-13 — The owner reported that Necromancer is missing one core in the app. The 9.31.17 AM screenshot in `gameplay/talents/` shows **Crystal Staff·Core**: **Death Pulse enhances its DMG and Heal by 30% of Attack**. This completes Necromancer's four recorded cores; the app stores the gear name as **Crystal Staff** and links it to **Death Pulse**.

- 2026-09-13 — The owner requested three priority categories for build attributes: **Must have**, **Should have**, and **OK to have**. The categories may be indicated with colors or other visual cues rather than repeated text labels on every attribute.
- 2026-09-13 — The owner requested a **Reset** button on every build section and subsection.
- 2026-09-13 — The owner removed **Should have** from build priorities. All previous Should have selections become **OK to have**, leaving only **Must have** and **OK to have**.
- 2026-09-13 — **OK to have** must use the former Should have blue styling. The owner reiterated that previous Should have data becomes OK to have.

- 2026-09-13 — The owner requested that **hero listing pages show only heroes with recorded details**.

- 2026-09-13 — The owner's 11.33–11.37 AM screenshots supply full detail sets for **Jungle Envoy, Radiant Paladin, Silence, Gunslinger, Dark Knight, Arcane Saint, Witch Dictator, Silver Warrior, and Holy Healer**: six talents, four cores, four artifact tiers, two red divinities, and hero-specific Awakening I/III. The reference above records their names, class, artifact, divinities, and source ranges; full descriptions are transcribed in the detail seeds.
- 2026-09-13 — The **Jungle Envoy** follow-ups (11.49.48 and 11.50.02 AM) complete **Pulse Nova**: 38% of ATK as magic DMG per second to all enemies for 7s, cannot be dispelled, ends on death, and reactivation refreshes duration. **Wizard's Wand** adds a 30% Heavy Injury Effect; no additional parenthesized value is shown.
- 2026-09-13 — **Witch Dictator's Dark Faded (I)** is completed by the inner-description scroll at **11.51.47 AM**, combined with 11.50.20: enemies take 5% more Magic DMG, Basic ATKs have a 30% chance to freeze for 1.5s, and all its freeze effects reduce enemy energy by 30 (3s cooldown).
- 2026-09-13 — Artifact attachment is not determined by quality: **Dark Knight's gold Frost Dark Axe**, **Gunslinger's gold Full-out Shooting**, and **Witch Dictator's red Withering Fear** are standalone. Gunslinger's rainbow modifies **Snipe**; Witch Dictator's rainbow modifies **Frost Echo**. Only linked abilities appear under Talents as well as Artifacts.
- 2026-09-13 — The new talent popups establish **Attribute** as another in-game kind; positions do not determine kind. **Holy Healer's Darkness Strike** (2★) is Enhance, **Radiant Paladin's Purifying Light** is Passive, and **Silence's Wisdom Blade / Gunslinger's Shotgun** (2★) are Special Skill.
- 2026-09-13 — Screenshot wording must preserve actual displayed values and aliases: Silence Domain says "for 4" without a unit; Radiant Paladin's Luminous Visor reads 30%(100%); Witch Dictator's Spell Tome reads 0.3%(1%) HP recovery. Silver Warrior's Boots say "Blade of Destruction" but belong to **Annihilation Blade**, and Holy Healer's "Darkness Forbidden Land" descriptions belong to **Darkness Land**.

- 2026-09-13 — Divinity categories: move **Knockback Resist** (owner wrote "knockback reset") and **SPD Reduction RES** into **Knockback**; group **Heavy Injury**, **Healing Effect** ("headling effect"), and **Receive Healing** under **Healing** (owner allowed "healing/heal"). These category choices override the popup-derived RES, Weakness, and Cleansing groups.

- 2026-09-13 — The owner requested that hero cards **not display divinities in lineups or the lineup builder**, including the hero picker and selected slots.

- 2026-09-13 — The owner's 12.47.59–12.48.15 PM screenshots establish **Radiant Envoy / Mage**, six talents (**Final Spark, Light Binding, Enhanced Flash, Prismatic Barrier, Light Body, Beam Charge**), four cores, and **Wand of Light** with all four artifact tiers. Red divinities match **DMG Increase** (left) and **Magic DMG Boost** (right). The 12.48.06 PM scroll completes Mage Robe; 12.48.15 PM completes the standalone rainbow skill **Lucent Singularity**. Spell Tome's Beam Charge effect explicitly reduces **Melee DMG Reduction by 27% (80%) for 6s**.
- 2026-09-13 — The owner supplied `gameplay/talents/image.png`, an **MR-UK awakening guide excerpt for Radiant Envoy**. It lists the unique skills **Radiant Glow** and **Holy Light Field**, interleaved with Mage common skills **Spell Barrier** and **Psychic Surge**. This is a third-party reference, not owner-confirmed game wording; I/III are prefilled in the guide's order pending in-game verification. Shared Mage skills remain documented separately.
- 2026-09-13 — The owner explicitly chose **"Use the supplied guide"** for Radiant Envoy's Awakening I **Radiant Glow** and III **Holy Light Field**, with `image.png` recorded as their source. This resolves the pending source decision; additional in-game awakening screenshots are not required for this update. The source remains attributed to MR-UK, and the choice does not add the guide's common Mage skills to hero-specific data.

- 2026-09-13 — The owner requested pets in the database, then clarified: **"just add icon and pet name"**. Record only names and screenshot-derived icons.

- 2026-09-13 — The owner requested relics in the database: **"just icons and names"**. Use the supplied `gameplay/relics/` screenshots for both.

- 2026-09-13 — The owner requested editable lineups, with each hero assignable to **one or more pets and relics**. Pet/relic assignment controls belong **inside the hero card, like divinities**.

- 2026-09-13 — The owner dislikes the UI jumping when pet/relic pickers expand and requested **select dropdowns** instead.

- 2026-09-13 — Each lineup hero should be assignable to **one of its own saved builds**. Hovering over a build should show its stats in a popover; hovering over a core should show its linked skill in a popover.

- 2026-09-13 — The owner renamed the build priority **Must have** to **Should have**. This is a wording change: the two tiers are now **Should have** and **OK to have**, with existing selections and stored priority values preserved.

- 2026-09-13 — The owner flagged Shadow Fiend's missing fourth core. The recent `gameplay/talents/image copy.png` confirms **Crystal Pendant·Core** for **Destructive Gloom**: after each cast, gain **6% DMG Reduction for 10s**, with a **100% chance to purge all negative effects from self**. The same screenshot completes the red artifact bonus: immediately cast Destructive Gloom on entering battle, and increase Physical DMG from Shadow by **90%**. All four cores are now recorded; the Soul Mask rainbow ability remains unrecorded.

- 2026-09-13 — The owner requested an **eye icon beside a hero's build in a lineup** so users know they can hover to preview it. Show the cue in saved lineup cards and the lineup editor, including build options with previews.

- 2026-09-13 — The owner requested an option to **clone a lineup**.

- 2026-09-13 — The owner requested an additional rune-attribute category named
  **Important (x2)**.
- 2026-09-13 — The owner clarified: **Important (x2)** is **red** and applies
  **only to runes**.
- 2026-09-13 — The owner renamed **Important (x2)** to **Important**. It remains
  red and applies only to runes.
- 2026-09-13 — **Important** uses **one red diamond** and exactly that label.
  Its rune-only scope is implicit; do not add a scope suffix to the label.
- 2026-09-13 — The owner clarified that **Important applies to every build
  area: rune attributes, weapon attributes, and cores**, superseding the earlier
  rune-only restriction. The label and one red diamond remain the same.
- 2026-09-13 — The owner reported layout shifts when toggling build items and
  requested stable layout across selection and priority changes.
- 2026-09-13 — The owner requested that sections with no data remain visible
  with a placeholder. Build displays keep Runes, every rune type, Weapons, and
  Cores visible even when no items are selected.
- 2026-09-13 — The owner reported layout shifts when a popover opens, suspected
  scrollbar appearance as the cause, and requested a fix. The owner also requested
  wider build popovers.

- 2026-09-14 — The owner requested a readiness review of the new
  `gameplay/talents/` screenshots **without Awakening I/III**. The 171 supplied
  captures cover 12 heroes without detail entries and four already recorded
  heroes. The review establishes six talents, four artifact tiers, and catalog
  divinities for all 12; Mermaid Princess's fourth core is the only missing
  non-awakening panel identified. This entry records a review, not an import.

- 2026-09-14 — The owner supplied Mermaid Princess's missing scrolled popup,
  `Screenshot 2026-09-14 at 8.05.14 AM.png`. It confirms **Tome of Radiance·Core**
  for **Deep Sea Blessing**: additionally increases the DMG Result of the allied
  Hero with the highest Attack by **3%(9%)**. This resolves the previous review's
  fourth-core gap; all 12 new hero entries now have sufficient screenshots when
  excluding Awakening I/III. This follow-up is a review, not an import.

- 2026-09-14 — The owner authorized adding the 12 reviewed heroes with multiple
  agents, retaining the batch's exclusion of Awakening I/III. Their screenshots
  establish the talent order, four core links, four artifact tiers, and two
  mythic divinities recorded in the September 14 section above. All 12 detail
  entries are now imported, including Mermaid Princess's fourth core from the
  8.05.14 AM follow-up; existing Archive portraits are retained.

- 2026-09-14 — **Readiness review of the new 8.35.37–8.45.28 AM batch:** the
  owner's 147 screenshots cover 14 heroes. Skeleton King, Whirlpool Ninja,
  Foxy Spirit, Loli, GooGoo Fish, Moon Goddess, Cowboy Killer, White Ox, Hidden
  Ninja, Snow Hunter, Swordevil, and Mars have complete non-awakening evidence.
  Jungle Archer supplies only Forest Longbow's Artifact tab and all four
  abilities. Gunslinger's supplied content agrees with its existing detail seed.
  All 13 new candidates lack I/III screenshots; the previous batch's exclusion
  was not applied to this review. The source and readiness tables above record
  these findings; no seeds, public assets, or database content were imported.
- 2026-09-14 — The owner's **8.35.38 AM** Skeleton King popup labels
  **Bloodthirsty Curse** as **Aura**: increases Lifesteal for all Melee allies
  by 15%. Moon Goddess's **8.39.35 AM** **ATK SPD Aura** also has kind **Aura**:
  increases all Ranged allied heroes' ATK SPD by 10%. These are screenshot-backed
  game facts; the app's current talent-kind list has no Aura entry.
- 2026-09-14 — The same review establishes the hero/artifact/divinity identities,
  clockwise talent order, title aliases, core continuations, and artifact
  attachments listed in the 8.35–8.45 AM section. In particular, White Ox's
  **Life Shield** core belongs to **HP Shield**, and Hidden Ninja's **Thunder
  Beast Pursuit / Thunder Beast Possession** bonuses belong to **Beast Pursuit /
  Beast Possession**. Unusual parenthesized values remain as displayed.

- 2026-09-14 — **Jungle Archer follow-up review:** the owner supplied nine
  **9.01.10–9.01.19 AM** captures. They establish Gale Arrow (Ultimate, 0★),
  Fiery Barrage (Battle, 2★), Enhance Arrows (Enhance, 5★), High Speed (Special,
  8★), Hunter's Lineage (Attribute, 12★), and Upgraded Arrows (Enhance, 16★),
  plus all four core descriptions. **Arrow Core → Fiery Barrage** adds
  20%(60%) of Attack; **Hunter's Cloak → Enhance Arrows** and **Swift Longbow →
  Gale Arrow** each add 40%(120%) of Attack as Physical DMG. Hunter's Cloak's
  text uses the alias **Empowered Arrows**. The **9.01.14 AM 1.png** scroll
  completes **Crystal Pendant → High Speed**: ATK SPD and MOV SPD additionally
  increase by 5%(15%). Together with the earlier Forest Longbow captures, this
  closes every non-awakening gap for Jungle Archer, bringing all 13 new
  candidates to complete non-awakening coverage. I/III remain missing for all
  13. This is a review, not an import.

## How the app models it

- Invitation codes have an optional `lineupId`: null grants the full library;
  a lineup ID grants that lineup only. `invitation_redemptions` links each
  single-use code to one device and allows many grants per device. Migration
  `0026_lineup_invitations.sql` preserves existing full-library registrations.
  Deleting a lineup removes its invitations and grants while retaining the
  device and its other grants. Page/metadata checks, filtered lineup queries,
  and artwork authorization all enforce the same device scope.

- Rune attributes, weapon attributes, and cores have three owner-assigned
  priority tiers: **Important**,
  **Should have**, and **OK to have**, shown as one red diamond, gold diamond,
  and blue dot, with a shared legend.
  Rune attributes, weapon attributes, and cores each store a `priority`
  (`build_priority`: important | must | optional); all three tiers are accepted
  in every build area, and `must` displays as **Should have**.
  Former middle-tier selections remain OK to have, which is also the default.
  Editing cycles through the tiers and then
  removes the selection; imports preserve tiers. Pick order is retained within
  each tier. Chips reserve the same space for the unselected plus and all priority
  markers so toggling does not change chip widths or row wrapping.
  Saved builds and previews retain every section and rune type, with a placeholder
  for empty selections. Editors also show placeholders for empty catalogs.
  Build popovers are up to 40rem wide and stay within the viewport. Info popovers
  use fixed positioning, with stable scrollbar gutters on the page and popup to
  prevent width changes when previews open or their content needs scrolling.
  In the editor, Reset clears the draft selections and priorities for
  Runes, Weapons, Cores, or one rune type; the owner saves the build to apply it.

- Hero builds include hand-picked **cores** from that hero's recorded talent
  bonuses, alongside rune and weapon attributes. Core selections have the same
  three tiers. A build may contain only cores.
- Saved hero builds offer **Clone** to signed-in admins (owner, 2026-09-14).
  It opens an editable copy on the same hero, preserving notes, all rune/weapon/
  core selections, pick order, and priority tiers. The name gets a ` (copy)`
  suffix within the 120-character limit. Save creates a new build; Cancel
  discards the draft. The source build and its lineup assignments stay intact.
- `hero_build_cores` links each build to its hero's cores with `priority` for the
  tier and `sortOrder` within it. Hero detail synchronization matches cores by name, keeping IDs and
  build selections stable. Imports map matching gear names to the destination
  hero's own effects; unavailable names are reported instead of copied.

- `heroes` table: `slug`, `name`, `role` (warrior | marksman | mage | support),
  `rarity` (mythic | legend | epic), `imageUrl`, `notes`.
- `pets` table: `slug`, `name`, `iconUrl` (`/pets/<slug>.png`), plus the standard
  ID and creation timestamp. The 20 names/icons in `src/data/pets.ts` are seeded
  by `ensurePetsSeeded()` in `src/lib/pets.ts`; `getAllPets()` reads them by name.
  No pet skills, stats, or bonuses are stored; lineup assignments use separate links.
- `fishes` table: `slug`, `name`, optional `iconUrl`, `area`, `fishType`,
  `collection`, ordered `stats` (names only), `baseStats`, `specialStats`,
  optional `bait`, ID, and creation timestamp. Migration `0027_fish_stats.sql`
  adds the two stat groups. `getAllFishes()` synchronizes source records once
  per process, preserving IDs and lineup selections.
  Regenerate `src/data/fishes.ts`, `scripts/upsert-fishes.sql`, and all 130 icons
  with `python3 scripts/import-fishes.py` (Pillow required). The importer reads
  the seven area CSVs and `gameplay/fishes/icons.json`, which maps stable slugs
  to visually reviewed owner screenshots. It crops the complete circular icon
  panel, excluding titles and personal catch records. Duplicate screenshots
  are excluded. Screenshot spellings correct Icy River Carp, Peacock Fish,
  and Cobra Bass without changing their existing slugs.
  `/fishes` shows localized names, icons, both stat groups, fishing area,
  bait (icon/name, or None). Collection information is omitted from the cards.
  Fishes with special stats sort first, then alphabetically within both groups.
  Search matches English and Vietnamese names;
  category and area filters combine with search. Empty special stats display
  “None recorded”; no numeric values are inferred. The catalog follows the
  existing page-access rules and can be explicitly shared via Public URLs.
- `baits` stores the 10 owner-supplied shop entries with name, stable slug,
  cropped icon, description, nullable target category, and the displayed bonus
  percentages. Source: `gameplay/fishes/baits.json` and the 2026-09-15
  9.59.13–9.59.25 screenshots. Regenerate seeds, SQL, and icons with
  `python3 scripts/import-baits.py`, then regenerate fishes with
  `python3 scripts/import-fishes.py`. Quantity badges and shop controls are
  excluded from the icons; displayed bonuses are not claimed as maximums.
  Migration `0028_bait_catalog.sql` seeds the bait table before adding the
  nullable foreign key from `fishes.bait` to the unique bait name. Name updates
  cascade; deleting a bait clears its fish links. The legacy CSV “Mayfly”
  resolves to the screenshot title “Mayfly Bait” (stable slug `mayfly`).
  Exactly 16 fish-specific links remain, with NULL for the other 114 fishes;
  category compatibility does not assign a bait. Baits seed before fishes.
  Fish cards and location popovers show the bait icon/name or explicit None.
  Artwork access includes only baits assigned to fishes on the allowed page.
- `lineup_fishes`: ordered, unique fish selections linked to the whole lineup.
  Each selection stores a `quantity` of **1–4**, enforced by input validation
  and a database check. Migration `0024_lineup_fish_quantities.sql` gives existing
  selections quantity 1. Edit and clone drafts preserve every fish's quantity.
  Saving or editing replaces these links in the same transaction as the formation
  and hero assignments. Deleting a lineup or fish cascades its links. The builder
  has one fixed-height multi-select dropdown per category (**Small, Medium,
  Large, Aquatic**), with a quantity selector for each fish. Multiple distinct
  fishes are allowed in every category; the quantity limit applies to each fish.
  Saved lineup lists and detail pages group fish icons, names, and quantities by
  category. The shared `FishChip` opens a `FishPopover` with the fish icon,
  name, category, base stats, special stats, location, and assigned bait (or None).
  The builder uses the same preview in picker options and selected chips below
  each dropdown; its closed category trigger also includes the first selected
  fish’s icon. Preview buttons stay separate from checkbox/quantity controls.
  Popovers support desktop hover and touch/keyboard press, with no collection info.
  Fish chips fill equal-width category columns with fixed 40px single-line rows;
  long names truncate while icons and quantities remain visible. Picker options
  use fixed 48px rows. The builder reserves a 7rem selected-fish viewport per
  category and a fixed-height search popup; overflow scrolls with stable gutters
  so selecting or filtering does not shift the surrounding layout.
  Each dropdown includes a fish-name search; filtering preserves selections and
  quantities. The search resets when a category dropdown is opened.
  While migration 0024 is pending, reads treat existing selections as quantity 1
  and saves with one copy per fish still work. Saving multiple copies returns a
  form error before changing the lineup, instead of crashing or losing quantities.
- `divinities` table: `slug`, `name` (stat without "All"), `kind` (display category,
  with owner corrections taking precedence over popup titles), `iconUrl`
  (`/divinities/<slug>.png`). Seeded from `src/data/divinities.ts`
  by `ensureDivinitiesSeeded()` in `src/lib/divinities.ts`; no hero link yet.
- `weapon_attributes` table: `slug`, `name` (as printed in the Possible Attributes
  popup), `sortOrder`. Seeded from `src/data/weapon-attributes.ts` by
  `ensureWeaponAttributesSeeded()` in `src/lib/weapons.ts`; no per-weapon pools and
  no page yet. Not linked to divinities.
- `relics` table: `slug`, `name`, `iconUrl` (`/relics/<slug>.png`), plus an ID and
  creation timestamp. Regenerate icons, `src/data/relics.ts`, and
  `scripts/upsert-relics.sql` with `python3 scripts/slice-relics.py`; apply the SQL
  to import the catalog while preserving existing IDs. `getAllRelics()` in
  `src/lib/relics.ts` reads the catalog without writes. Lineup assignments use
  separate links; relics have no standalone page or hero-build links.
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
  `skillId` (the talent it modifies; null for standalone artifact skills),
  `name` (standalone skills only), `description`, `sortOrder`. A bonus attached to a talent is
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
  Each slot also has an optional `buildId` referencing one of that hero's saved
  builds. Server validation rejects another hero's build; deleting the build
  clears this reference while retaining the hero and its pet/relic assignments.
  Build previews show the current saved build, including subsequent edits.
- `lineup_hero_pets` + `lineup_hero_relics`: ordered, unique catalog selections
  linked to a `lineup_heroes` row. Removing a lineup hero deletes its assignments.
  Creating or editing a lineup saves the whole formation and assignments atomically.
- `/divinities` — read-only list of all divinities, grouped by kind, icon + name.
- `/divinities/[slug]` — one divinity: icon, name, kind, and the heroes whose mythic
  divinities include it (portrait grid linking to the hero pages). Divinity badges on
  `/divinities` and on hero pages link here. All seeded heroes are synced on load so
  the list is complete regardless of which hero pages were opened.
- `/heroes` — the pool: read-only portrait grid with search and class filter,
  showing only heroes with an entry in `heroDetailSeeds`. Partly recorded heroes
  are included. Each hero is shown as `{class badge} {name}`; badges live in
  `public/badges/<role>.png`. The same visibility rule applies to the hero picker
  and divinity hero lists, using `getRecordedHeroSlugs()` on the server.
- `/lineups/new` — pick heroes with recorded details into slots, add name + notes,
  save. A name and all five distinct heroes are required; optional assignments
  and notes can be completed later.
  Existing saved lineups retain their recorded formation, including empty slots.
- `/lineups/new?clone=<id>` — initialize a new draft from a saved lineup, including
  heroes that are no longer in the picker. The draft omits the source lineup ID
  and saves through the existing create action. Build and catalog references are
  reused; the lineup and assignment rows are new. Invalid or missing sources
  return not found. Clone links appear on the lineup list and detail page.
- `/lineups`, `/lineups/[id]` — browse and view saved lineups.
- `/lineups/[id]/edit` — edit a saved lineup, with pet/relic multi-select controls
  inside each selected hero card. Editing preserves the lineup ID and share URL.
  A fixed-height build dropdown offers that hero's own saved builds. Build names
  open stats popovers on hover or tap; core chips open nested popovers with the
  core effect and its linked skill's name, kind, unlock stars, icon, and description.
  The same core previews are available on hero pages and in the build editor.
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
  On 2026-09-14, the configured database was still at 0025 while the app queried
  the new invitation schema, causing "Access is temporarily unavailable".
  Migration 0026 was tested on a disposable database and applied with that
  transaction fallback, including its journal entry and existing-device backfill.
  The live access query now succeeds. Registrations made by an older deployment
  remain readable through the original invitation reference during rollout.

### UI theme

shadcn/ui components (`src/components/ui/`, base-nova style) themed in
`src/app/globals.css`: gold primary, warm parchment light mode, deep navy dark mode,
0.75rem radius, slightly enlarged type scale. Light/dark follows the system and can
be toggled in the header (`next-themes`, class strategy). Add components with
`pnpm dlx shadcn@latest add <name>`.

### Game label localization

The owner plans to supply actual Vietnamese in-game labels (2026-09-14). Use
[the Vietnamese capture checklist](vietnamese-label-screenshot-checklist.md)
to collect this evidence; current app translations are not verification of the
game’s Vietnamese wording.

Hero, fish, pet, relic, divinity, talent, awakening, core, artifact, attribute,
and fishing labels must support English and Vietnamese (owner, 2026-09-14).
Translations are display content; recorded source text, IDs, and relationships
remain stable. The owner suggested translation keys as the storage boundary.
The app uses namespaced translation keys derived from existing catalog slugs
(e.g. `hero.sea-captain`, `fish.lemon-fish`) without replacing recorded names in
the database. Labels without a stored slug have explicit dictionary keys and a
source-name lookup. Vietnamese game names are display translations of the
recorded English names, not new screenshot transcriptions. Hero/fish searches
and build-import hero searches match both languages, including accentless input.

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
in reading order, roles, rarity per screenshot) and rerun it. New heroes are
inserted by the normal `ensureHeroesSeeded()` read flow;
`scripts/upsert-heroes.sql` is also regenerated for explicit roster updates.

Because image files are replaced in place, every game image URL carries a
cache-busting `?v=N` from `src/lib/asset-version.ts` (`versioned()`). Bump
`ASSET_VERSION` when re-slicing changes existing portraits, divinity / talent /
artifact icons; adding only new paths needs no bump. `next.config.ts` allows
exactly that query string for all local images.
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

For category-only changes, edit `CATALOG` and run
`python3 scripts/slice-divinities.py --catalog-only`, then apply the generated
upsert SQL. This updates seed metadata without replacing icons or requiring an
asset-version bump. `kind` follows the owner's categories even when they differ
from the original popup titles.

### Pet icon pipeline

`scripts/slice-pets.py` reads the 20 Activated Pets popups in `gameplay/pets/`.
Its `CATALOG` maps each source screenshot to the pet name and popup-art bounds.
It extracts the art above the pet name, removes the surrounding popup background
and shared border, and keeps detached body parts on a transparent square canvas.
It writes `public/pets/<slug>.png`, `src/data/pets.ts`, and
`scripts/upsert-pets.sql`. Run the SQL against Supabase after regenerating.
`--catalog-only` regenerates names/paths without replacing icons. Bump
`ASSET_VERSION` when replacing existing icons.

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
| Hellscream | Warrior | Eternal | `hellscream` |
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
| Dark Queen | Marksman | Eternal | `dark-queen` |
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
