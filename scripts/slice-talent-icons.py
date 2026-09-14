#!/usr/bin/env python3
"""Cut talent, artifact-bonus, core and artifact icons from the owner's
Talent/Artifact tab screenshots (699x1260 phone captures).

Usage:  python3 scripts/slice-talent-icons.py            (needs Pillow + numpy)

After rerunning, bump ASSET_VERSION in src/lib/asset-version.ts so browsers and
next/image drop their cached copies of replaced icons.

Per hero, LAYOUT lists the talent popup screenshots (one per talent, opened by
tapping the talent on the Talent tab) and the Artifact tab screenshot. Writes:

  public/talents/<hero>/<skill-slug>.png   round talent icon from the popup
  public/artifacts/<hero>.png              the artifact (divine weapon) image
  public/icons/artifact-<tier>.png         purple / gold / red / rainbow tier diamonds
                                           (from the artifact popup's ability list)
  public/icons/core.png                    the core gem

The bonus/core icons are the same for every hero, so they are written once
(first screenshot that shows them wins). Paths are referenced by hand in
src/data/hero-details.ts.

A talent popup has 1–3 stacked dark panels with black borders: the talent, then
optionally "Artifact Bonus" and "<Gear>·Core"; the core gem is cut from the
latter's top-left.
"""
import os, re, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "gameplay/talents")
NB = "\u202f"
S = lambda t: f"Screenshot 2026-09-12 at {t}{NB}PM.png"
S13AM = lambda t: f"Screenshot 2026-09-13 at {t}{NB}AM.png"
S13PM = lambda t: f"Screenshot 2026-09-13 at {t}{NB}PM.png"
S14AM = lambda t: f"Screenshot 2026-09-14 at {t}{NB}AM.png"
S14PM = lambda t: f"Screenshot 2026-09-14 at {t}{NB}PM.png"

# hero slug -> {"popups": [(file, talent name), ...],
#               "artifact": Artifact tab, "artifact_popup": the artifact's ability list}
LAYOUT = {
    "swordmaster": {
        "popups": [
            (S14PM("12.58.31"), "Infernal Oni Slash"),
            (S14PM("12.58.22"), "36 Pound Cannon"),
            (S14PM("12.58.24"), "Enhanced Slash"),
            (S14PM("12.58.25"), "Rashomon"),
            (S14PM("12.58.28"), "Armament Haki"),
            (S14PM("12.58.29"), "Path of Asura"),
        ],
        # The popup supplies colored art without the tab's activation/progress UI.
        "artifact": S14PM("12.58.40").replace(".png", " 1.png"),
        "artifact_box": (78, 244, 235, 417),
        "artifact_corner_radius": 8,
        "artifact_popup": S14PM("12.58.40").replace(".png", " 1.png"),
    },
    # September 14 10.40–10.45 AM batch and 10.57–10.58 AM follow-ups.
    "wine-immortal": {
        "popups": [
            (S14AM("10.40.44"), "Storm Warrior"),
            (S14AM("10.40.36"), "Ground-Shaking Hit"),
            (S14AM("10.40.39"), "Swift Steps"),
            (S14AM("10.40.40"), "Wine Mist Flame"),
            (S14AM("10.40.42"), "Drunken Dance"),
            (S14AM("10.40.43"), "Earth Element"),
        ],
        "artifact": S14AM("10.40.48"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.40.49"),
    },
    "abyssal-queen": {
        "popups": [
            (S14AM("10.41.00"), "Abyss Roar"),
            (S14AM("10.40.53"), "Poisoned Blade"),
            (S14AM("10.40.54"), "Sonic Enhance"),
            (S14AM("10.40.55"), "Queen's Shriek"),
            (S14AM("10.40.57"), "ATK Amplification"),
            (S14AM("10.40.59"), "Super Sonic Wave"),
        ],
        # The ability popup preserves the sickle tip obscured by stars on the tab.
        "artifact": S14AM("10.41.04"),
        "artifact_box": (78, 244, 235, 417),
        "artifact_corner_radius": 8,
        "artifact_popup": S14AM("10.41.04"),
    },
    "iron-fan-princess": {
        "popups": [
            (S14AM("10.41.19"), "Palm-Leaf Fan·Wind"),
            (S14AM("10.41.12"), "Palm-Leaf Fan·Power"),
            (S14AM("10.41.14"), "Windborne Steps"),
            (S14AM("10.41.15"), "Palm-Leaf Fan·Fire"),
            (S14AM("10.41.17"), "Wind Guardian"),
            (S14AM("10.41.18"), "Wind Fury"),
        ],
        "artifact": S14AM("10.41.22"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.41.23"),
    },
    "otherworld-prisoner": {
        "popups": [
            (S14AM("10.41.57"), "Flame Impact"),
            (S14AM("10.41.50"), "Ignite"),
            (S14AM("10.41.52"), "Flame Enhancement"),
            (S14AM("10.41.53"), "Imprint"),
            (S14AM("10.41.54"), "Passionate Soul"),
            (S14AM("10.41.56"), "Blazing Flames"),
        ],
        "artifact": S14AM("10.41.59"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.42.00"),
    },
    "wizard": {
        "popups": [
            (S14AM("10.42.13"), "Paralysis Potion"),
            (S14AM("10.42.04"), "Poison"),
            (S14AM("10.42.06"), "Enhance Potion"),
            (S14AM("10.42.07"), "Curse"),
            (S14AM("10.42.09"), "Energy Regen"),
            (S14AM("10.42.11"), "Potent Potion"),
        ],
        "artifact": S14AM("10.42.16"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.42.17"),
    },
    "templar": {
        "popups": [
            (S14AM("10.42.29"), "Phase Shift"),
            (S14AM("10.42.22"), "Psi Blade"),
            (S14AM("10.42.23"), "Phase Boost"),
            ("Screenshot 2026-09-14 at 10.42.25 AM 1.png", "Mind Trap"),
            (S14AM("10.42.26"), "Assassin Pact"),
            (S14AM("10.42.27"), "Shadow Rush"),
        ],
        "artifact": S14AM("10.57.58"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.58.00"),
    },
    "warlock": {
        "popups": [
            (S14AM("10.42.44"), "Infernal"),
            (S14AM("10.42.36"), "Cataclysm"),
            (S14AM("10.42.38"), "Hell Harbinger"),
            (S14AM("10.42.39"), "Dark Word"),
            (S14AM("10.42.41"), "Corrupting Heart"),
            (S14AM("10.42.43"), "Hell Fist"),
        ],
        "artifact": S14AM("10.42.47"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.42.48"),
    },
    "darkin-hunter": {
        "popups": [
            (S14AM("10.43.03"), "Corrupt Chains"),
            (S14AM("10.42.55"), "Blight Quiver"),
            (S14AM("10.42.57"), "Chain Power"),
            (S14AM("10.42.58"), "Pierce Bolt"),
            (S14AM("10.43.00"), "Darkin Blood"),
            (S14AM("10.43.01"), "Vine Bind"),
        ],
        "artifact": S14AM("10.43.05"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.43.06"),
    },
    "earthbreaker": {
        "popups": [
            (S14AM("10.43.20"), "Fissure"),
            (S14AM("10.43.11"), "Empowered Totem"),
            (S14AM("10.43.13"), "Rupture"),
            (S14AM("10.43.14"), "Aftershock"),
            (S14AM("10.43.17"), "Brawny"),
            (S14AM("10.43.18"), "Shattered Ground"),
        ],
        "artifact": S14AM("10.43.23"),
        # Keep the upper ember; a shallow notch removes the adjacent stars.
        "artifact_box": (200, 235, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_polygon": [(0, 0), (115, 0), (115, 7), (181, 7),
                             (181, 0), (305, 0), (305, 295), (0, 295)],
        "artifact_popup": S14AM("10.43.24"),
    },
    "observer": {
        "popups": [
            (S14AM("10.43.36"), "Annihilator"),
            (S14AM("10.43.28"), "Ion Split"),
            (S14AM("10.43.30"), "Ray Boost"),
            (S14AM("10.43.31"), "Void Rift"),
            (S14AM("10.43.33"), "Void Force"),
            (S14AM("10.43.34"), "Ray Charge"),
        ],
        # Preserve the lower artwork tip while excluding progress UI.
        "artifact": S14AM("10.43.39"),
        "artifact_box": (200, 244, 505, 540),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.43.40"),
    },
    "dark-shaman": {
        "popups": [
            (S14AM("10.44.06"), "Serpent Ward"),
            (S14AM("10.44.00"), "Celestial Shock"),
            (S14AM("10.44.01"), "Enhanced Ward"),
            (S14AM("10.44.02"), "Hex"),
            (S14AM("10.44.04"), "Troll Bloodline"),
            (S14AM("10.44.05"), "Serpent Urn"),
        ],
        "artifact": S14AM("10.44.09"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.44.10"),
    },
    "hellscream": {
        "popups": [
            (S14AM("10.44.25"), "War Cry"),
            (S14AM("10.44.17"), "Bloodlust"),
            (S14AM("10.44.19"), "For the Tribe"),
            (S14AM("10.44.20"), "Earth Shatter"),
            (S14AM("10.44.22"), "Orc Bloodline"),
            (S14AM("10.44.24"), "Ancient Energy"),
        ],
        "artifact": S14AM("10.44.31"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.44.32"),
    },
    "bone-archer": {
        "popups": [
            (S14AM("10.44.43"), "Deathly Pact"),
            (S14AM("10.44.36"), "Specter Curse"),
            (S14AM("10.44.38"), "Flaming Arrow"),
            (S14AM("10.44.39"), "Rapid Fire"),
            (S14AM("10.44.40"), "Undead Body"),
            (S14AM("10.44.41"), "Revenant Pact"),
        ],
        "artifact": S14AM("10.44.46"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.44.47"),
    },
    "dark-queen": {
        "popups": [
            (S14AM("10.44.59"), "Dread Arrow"),
            (S14AM("10.44.51"), "Dark Arrow"),
            (S14AM("10.44.53"), "Wail of the Dead"),
            (S14AM("10.44.54"), "Withering Shot"),
            (S14AM("10.44.56"), "Ranger General"),
            (S14AM("10.44.57"), "Surging Energy"),
        ],
        # Preserve the lower artwork tip while excluding progress UI.
        "artifact": S14AM("10.45.01"),
        "artifact_box": (200, 244, 505, 540),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.45.02"),
    },
    # September 14 9.58–10.02 AM batch and Snowoman 10.10 AM follow-up.
    "snowoman": {
        "popups": [
            (S14AM("10.10.23"), "Blizzard"),
            (S14AM("9.58.29"), "Ice Blast"),
            (S14AM("9.58.31"), "Bone-Chilling Cold"),
            (S14AM("9.58.32"), "Glorious Aura"),
            (S14AM("9.58.33"), "Ice Purification"),
            (S14AM("9.58.35"), "Storm Domain"),
        ],
        # The Blizzard follow-up is scrolled; the ring retains the whole icon.
        "talent_icons": {
            "Blizzard": {
                "source": S14AM("9.58.26"),
                "box": (278, 369, 430, 521),
                "inset": 18,
            },
        },
        "artifact": S14AM("9.58.42"),
        "artifact_box": (215, 237, 490, 519),
        "artifact_corner_radius": 8,
        # Preserve the upper blade tip while excluding the three progress stars.
        "artifact_polygon": [(0, 0), (97, 0), (97, 6), (175, 6), (175, 0),
                             (275, 0), (275, 282), (0, 282)],
        "artifact_popup": S14AM("9.58.43"),
    },
    "bamboo-hat": {
        "popups": [
            (S14AM("9.58.54"), "Energy Impact"),
            (S14AM("9.58.47"), "Weakness Sensing"),
            (S14AM("9.58.49"), "Energy Overload"),
            (S14AM("9.58.50"), "Qi Mantra"),
            (S14AM("9.58.52"), "ATK Amplification"),
            (S14AM("9.58.53"), "Energy Burst"),
        ],
        "artifact": S14AM("9.58.56"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("9.58.57"),
    },
    "fire-sorceress": {
        "popups": [
            (S14AM("9.59.17"), "Flame Shock"),
            (S14AM("9.59.02"), "Burn"),
            (S14AM("9.59.11"), "Blazing Slash"),
            (S14AM("9.59.13"), "Blaze"),
            (S14AM("9.59.14"), "ATK Amplification"),
            (S14AM("9.59.15"), "Enhance Impact"),
        ],
        "artifact": S14AM("9.59.18"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("9.59.19"),
    },
    "red-hood": {
        "popups": [
            (S14AM("9.59.34"), "Mushroom Bomb"),
            (S14AM("9.59.24"), "Poisoned Shooting"),
            (S14AM("9.59.25"), "Here comes the bomb"),
            (S14AM("9.59.26"), "Time Bomb"),
            (S14AM("9.59.32"), "I am Red Hood"),
            (S14AM("9.59.33"), "Big-headed Mushroom"),
        ],
        "artifact": S14AM("9.59.37"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("9.59.38"),
    },
    "little-goblin": {
        "popups": [
            (S14AM("9.59.47"), "Master of Machinery"),
            (S14AM("9.59.41"), "Throw Mastery"),
            (S14AM("9.59.42"), "Quick Release"),
            (S14AM("9.59.43"), "DEF Formation"),
            (S14AM("9.59.45"), "Knockback Boost"),
            (S14AM("9.59.46"), "Spare Tool"),
        ],
        "artifact": S14AM("9.59.50"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("9.59.51"),
    },
    "radiant-angel": {
        "popups": [
            (S14AM("10.00.02"), "Holy Light Protection"),
            (S14AM("9.59.55"), "Judgement"),
            (S14AM("9.59.57"), "Enhance Protection"),
            (S14AM("9.59.58"), "Holy Light Shines"),
            (S14AM("10.00.00"), "Holy Soul"),
            (S14AM("10.00.01"), "Super Protection"),
        ],
        "artifact": S14AM("10.00.05"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.00.05").replace(".png", " 1.png"),
    },
    "diva": {
        "popups": [
            (S14AM("10.00.22"), "Protagonist Arrive"),
            (S14AM("10.00.15"), "Full-out Merrying"),
            (S14AM("10.00.16"), "Enhance Stage"),
            (S14AM("10.00.18").replace(".png", " 1.png"), "Revisit"),
            (S14AM("10.00.18"), "Excited"),
            (S14AM("10.00.21"), "Plot Armor"),
        ],
        "artifact": S14AM("10.00.25"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.00.26"),
    },
    "little-deer": {
        "popups": [
            (S14AM("10.00.42"), "Awaken"),
            (S14AM("10.00.30"), "Poisoned Spear"),
            (S14AM("10.00.33"), "Purify"),
            (S14AM("10.00.34"), "Nourishment"),
            (S14AM("10.00.39"), "Assist"),
            (S14AM("10.00.40"), "Cleanse"),
        ],
        "artifact": S14AM("10.00.45"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.00.46"),
    },
    "lucifer": {
        "popups": [
            (S14AM("10.01.16").replace(".png", " 1.png"), "Doomsday Curse"),
            (S14AM("10.01.07").replace(".png", " 1.png"), "Flame Blade"),
            (S14AM("10.01.09"), "Strengthen Curse"),
            (S14AM("10.01.10"), "Demon Fire"),
            (S14AM("10.01.12"), "Demonic Contract"),
            (S14AM("10.01.13"), "Hatred Deepens"),
        ],
        "artifact": S14AM("10.01.19"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.01.21").replace(".png", " 1.png"),
    },
    "captain-pilot": {
        "popups": [
            (S14AM("10.01.35"), "Warrior Strike"),
            (S14AM("10.01.27"), "Molotov Cocktail"),
            (S14AM("10.01.28"), "Enhance Bullet"),
            (S14AM("10.01.29"), "Suppressive Shoot"),
            (S14AM("10.01.32"), "Weakness Break"),
            (S14AM("10.01.33"), "Explosive Bullet"),
        ],
        "artifact": S14AM("10.01.37"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.01.38"),
    },
    "li-bai": {
        "popups": [
            (S14AM("10.01.50"), "Sky-Splitting Sword"),
            (S14AM("10.01.42"), "Twin Swords"),
            (S14AM("10.01.44"), "Sword Breaker"),
            (S14AM("10.01.45"), "Sword Beam"),
            (S14AM("10.01.46"), "Lotus Sword"),
            (S14AM("10.01.48"), "Man and Sword"),
        ],
        "artifact": S14AM("10.01.53"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.01.54"),
    },
    "lady-pan": {
        "popups": [
            (S14AM("10.02.07"), "Cutlery Throw"),
            (S14AM("10.02.00"), "Home Delivery"),
            (S14AM("10.02.02"), "Precise Throw"),
            (S14AM("10.02.03"), "Deluxe Cake"),
            (S14AM("10.02.05"), "Culinary Mastery"),
            (S14AM("10.02.06"), "Spare Cutlery"),
        ],
        "artifact": S14AM("10.02.09"),
        "artifact_box": (200, 244, 505, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": S14AM("10.02.10"),
    },
    # September 14 8.35–8.45 AM and Jungle Archer 9.01 AM follow-up.
    "skeleton-king": {
        "popups": [
            (S14AM("8.35.46"), "Dark Soul Fireball"),
            (S14AM("8.35.38"), "Bloodthirsty Curse"),
            (S14AM("8.35.40"), "Hellfire Heavy Strike"),
            (S14AM("8.35.41"), "Return from the Underworld"),
            (S14AM("8.35.42"), "Dark Soul Real Body"),
            (S14AM("8.35.44"), "Hell King's Howl"),
        ],
        "artifact": S14AM("8.36.27"),
        "artifact_box": (215, 244, 490, 515),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "whirlpool-ninja": {
        "popups": [
            (S14AM("8.36.42"), "Energy Vortex"),
            (S14AM("8.36.33"), "Cloning Technique"),
            (S14AM("8.36.35"), "Enhance Vortex"),
            (S14AM("8.36.37"), "Unyielding"),
            (S14AM("8.36.39"), "Ninjutsu"),
            (S14AM("8.36.41"), "Super Charge"),
        ],
        "artifact": S14AM("8.36.44"),
        "artifact_box": (210, 250, 490, 525),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "foxy-spirit": {
        "popups": [
            (S14AM("8.37.00"), "Nightfire"),
            (S14AM("8.36.53"), "Soul Snatcher Orb"),
            (S14AM("8.36.55"), "Spell Surge"),
            (S14AM("8.36.56"), "Mind's Mirror"),
            (S14AM("8.36.57"), "Heart Cleansing"),
            (S14AM("8.36.59"), "Fox Fire"),
        ],
        "artifact": S14AM("8.37.03"),
        "artifact_box": (210, 250, 500, 520),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "loli": {
        "popups": [
            (S14AM("8.38.29"), "Super Bullet"),
            (S14AM("8.37.09"), "Explosive Flying Bullet"),
            (S14AM("8.37.11"), "Enhance Missile"),
            (S14AM("8.37.12"), "Explosive Strike"),
            (S14AM("8.37.16"), "ATK Amplification"),
            (S14AM("8.38.06"), "Concussion Bullet"),
        ],
        "artifact": S14AM("8.38.58"),
        "artifact_box": (210, 250, 500, 525),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "googoo-fish": {
        "popups": [
            (S14AM("8.39.13"), "Aqua Dance"),
            (S14AM("8.39.05"), "Steal"),
            (S14AM("8.39.08"), "Water Burst"),
            (S14AM("8.39.09"), "Sudden Assault"),
            (S14AM("8.39.10"), "Contract"),
            (S14AM("8.39.12"), "Dark Shadow"),
        ],
        "artifact": S14AM("8.39.16"),
        "artifact_box": (230, 250, 515, 520),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "moon-goddess": {
        "popups": [
            (S14AM("8.39.36"), "Meteor Shower"),
            (S14AM("8.39.22"), "Moon Goddess's Arrow"),
            (S14AM("8.39.23"), "Meteor Strike"),
            (S14AM("8.39.31"), "Encourage"),
            (S14AM("8.39.33"), "ATK Amplification"),
            (S14AM("8.39.35"), "ATK SPD Aura"),
        ],
        "artifact": S14AM("8.39.38"),
        "artifact_box": (210, 250, 500, 532),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "cowboy-killer": {
        "popups": [
            (S14AM("8.41.17"), "Barrage Bullets"),
            (S14AM("8.41.08"), "PEN Bullet"),
            (S14AM("8.41.10"), "Enhance Ammo"),
            (S14AM("8.41.11"), "Growth Favors"),
            (S14AM("8.41.13"), "Precise"),
            (S14AM("8.41.15"), "Metal Slug"),
        ],
        "artifact": S14AM("8.41.21"),
        "artifact_box": (215, 232, 490, 525),
        "artifact_corner_radius": 12,
        # The last progress star touches the barrel. Keep the barrel's curved
        # top while masking the star, with points relative to artifact_box.
        "artifact_polygon": [(0, 12), (189, 12), (200, 9), (210, 2),
                             (275, 2), (275, 293), (0, 293)],
        "artifact_popup": None,
    },
    "jungle-archer": {
        "popups": [
            (S14AM("9.01.18"), "Gale Arrow"),
            (S14AM("9.01.11"), "Fiery Barrage"),
            (S14AM("9.01.12"), "Enhance Arrows"),
            (S14AM("9.01.14"), "High Speed"),
            (S14AM("9.01.16"), "Hunter's Lineage"),
            (S14AM("9.01.17"), "Upgraded Arrows"),
        ],
        "artifact": S14AM("8.42.09"),
        "artifact_box": (210, 242, 500, 525),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "white-ox": {
        "popups": [
            (S14AM("8.44.07"), "Brute Charge"),
            (S14AM("8.43.55"), "Warrior Charge"),
            (S14AM("8.44.01"), "Heavy Strike"),
            (S14AM("8.44.03"), "HP Shield"),
            (S14AM("8.44.04"), "Indomitable"),
            (S14AM("8.44.05"), "Brute Strength"),
        ],
        "artifact": S14AM("8.44.09"),
        "artifact_box": (210, 245, 490, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "hidden-ninja": {
        "popups": [
            (S14AM("8.44.20"), "Beast Pursuit"),
            (S14AM("8.44.14"), "Paralysis ATK"),
            (S14AM("8.44.16"), "Beast Possession"),
            (S14AM("8.44.17"), "Seal Technique"),
            (S14AM("8.44.18"), "Quick Regen"),
            (S14AM("8.44.19"), "Super Beast"),
        ],
        "artifact": S14AM("8.44.23"),
        "artifact_box": (220, 242, 490, 532),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "snow-hunter": {
        "popups": [
            (S14AM("8.44.35"), "Freezing Arrows"),
            (S14AM("8.44.28"), "Frost Arrows"),
            (S14AM("8.44.29"), "Speedfrost Arrowhead"),
            (S14AM("8.44.30"), "Multiarrow"),
            (S14AM("8.44.32"), "Focus"),
            (S14AM("8.44.34"), "Explosive Arrows"),
        ],
        "artifact": S14AM("8.44.37"),
        "artifact_box": (220, 250, 490, 520),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "swordevil": {
        "popups": [
            (S14AM("8.45.08"), "Sweep Army"),
            (S14AM("8.45.00"), "Thunder Strike"),
            (S14AM("8.45.01"), "Skill Immunity"),
            (S14AM("8.45.03"), "Phantom Combo"),
            (S14AM("8.45.04"), "Strength Awakening"),
            (S14AM("8.45.06"), "Gale Aura"),
        ],
        "artifact": S14AM("8.45.10"),
        "artifact_box": (210, 250, 500, 530),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "mars": {
        "popups": [
            (S14AM("8.45.24"), "Spear of War"),
            (S14AM("8.45.16"), "Shield Bash"),
            (S14AM("8.45.18"), "Enhance Spear Strike"),
            (S14AM("8.45.20"), "DEF Stance"),
            (S14AM("8.45.22"), "Protective Shield"),
            (S14AM("8.45.23"), "Blood-Stained Spear"),
        ],
        "artifact": S14AM("8.45.27"),
        "artifact_box": (210, 242, 500, 535),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    # September 14 batch: reuse the shared tier/core icons.
    "hela": {
        "popups": [
            (S14AM("7.53.30"), "Spectral Servant"),
            (S14AM("7.53.22"), "Dark Swarm"),
            (S14AM("7.53.24"), "Spectral Drain"),
            (S14AM("7.53.25"), "Soul Shackles"),
            (S14AM("7.53.27"), "Undead Corpse"),
            (S14AM("7.53.28"), "Spectres"),
        ],
        "artifact": S14AM("7.53.33"),
        "artifact_box": (210, 250, 490, 515),
        "artifact_corner_radius": 16,
        "artifact_popup": None,
    },
    "shadow-master": {
        "popups": [
            (S14AM("7.54.16"), "Phantom Slash"),
            (S14AM("7.54.03").replace(".png", " 1.png"), "Illusory Nightmare"),
            (S14AM("7.54.05"), "Enhance Slash"),
            (S14AM("7.54.07"), "Flame Bullet"),
            (S14AM("7.54.09"), "Weakness Break"),
            (S14AM("7.54.11"), "Blood Thirst"),
        ],
        "artifact": S14AM("7.54.18"),
        "artifact_box": (230, 241, 490, 522),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "medusa": {
        "popups": [
            (S14AM("7.54.48"), "Energy Barrier"),
            (S14AM("7.54.40"), "Piercing Arrows"),
            (S14AM("7.54.41"), "Ultimate Empower"),
            (S14AM("7.54.42"), "Arcane Serpent"),
            (S14AM("7.54.45"), "Succubus Ancestry"),
            (S14AM("7.54.46"), "Sharp Arrowhead"),
        ],
        "artifact": S14AM("7.54.50"),
        "artifact_box": (215, 250, 490, 515),
        "artifact_corner_radius": 16,
        "artifact_popup": None,
    },
    "two-headed-dragon": {
        "popups": [
            (S14AM("7.55.06"), "Frost Domain"),
            (S14AM("7.54.59"), "Ice and Fire"),
            (S14AM("7.55.01"), "Enhance Chill"),
            (S14AM("7.55.02"), "Icy Inferno"),
            (S14AM("7.55.04"), "Dragon's Blood"),
            (S14AM("7.55.05"), "Extreme Cold"),
        ],
        "artifact": S14AM("7.55.10"),
        "artifact_box": (240, 262, 455, 487),
        "artifact_corner_radius": 16,
        "artifact_popup": None,
    },
    "mermaid-princess": {
        "popups": [
            (S14AM("7.55.28"), "Tide of Sighs"),
            (S14AM("7.55.19"), "Deep Sea Blessing"),
            (S14AM("7.55.20"), "Tidal Phenomenon"),
            (S14AM("7.55.21"), "Sanctus Waterball"),
            (S14AM("7.55.24"), "Knockback"),
            (S14AM("7.55.26"), "Abyssal Waters"),
        ],
        "artifact": S14AM("7.55.31"),
        "artifact_box": (215, 243, 495, 530),
        "artifact_corner_radius": 16,
        "artifact_popup": None,
    },
    "soul-doll": {
        "popups": [
            (S14AM("7.55.46"), "Soul Scissors"),
            (S14AM("7.55.39"), "ATK Enhancement"),
            (S14AM("7.55.40"), "Enhance Scissors"),
            (S14AM("7.55.41"), "Thread Bind"),
            (S14AM("7.55.43"), "Spiritual Cultivation"),
            (S14AM("7.55.45"), "Heavy Blow"),
        ],
        "artifact": S14AM("7.55.50"),
        "artifact_box": (205, 250, 500, 530),
        "artifact_corner_radius": 16,
        "artifact_popup": None,
    },
    "baphomet": {
        "popups": [
            (S14AM("7.56.21"), "Demonify"),
            (S14AM("7.56.14"), "Fanatic"),
            (S14AM("7.56.15"), "Rebirth"),
            (S14AM("7.56.16"), "Devil's Entanglement"),
            (S14AM("7.56.19"), "Devil's Wit"),
            (S14AM("7.56.20"), "RES Skin"),
        ],
        "artifact": S14AM("7.56.24"),
        "artifact_box": (205, 245, 500, 530),
        "artifact_corner_radius": 16,
        "artifact_popup": None,
    },
    "masked-ninja": {
        "popups": [
            (S14AM("7.56.40"), "Barrier Shield"),
            (S14AM("7.56.33"), "Silent Movement"),
            (S14AM("7.56.35"), "Enhance Shield"),
            (S14AM("7.56.36"), "Power Regen"),
            (S14AM("7.56.37"), "Protect Charm"),
            (S14AM("7.56.39"), "Super Barrier"),
        ],
        "artifact": S14AM("7.56.44"),
        "artifact_box": (205, 245, 500, 525),
        "artifact_corner_radius": 16,
        "artifact_popup": None,
    },
    "whaley-imp": {
        "popups": [
            (S14AM("7.56.58"), "Tsunami"),
            (S14AM("7.56.52"), "Wave Slash"),
            (S14AM("7.56.53"), "Enhance Tide"),
            (S14AM("7.56.54"), "Surge Guard"),
            (S14AM("7.56.55"), "Deep Sea Buildup"),
            (S14AM("7.56.56"), "Sea God's Wrath"),
        ],
        "artifact": S14AM("7.57.01"),
        "artifact_box": (220, 245, 490, 520),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "ironblade-mixed-race": {
        "popups": [
            (S14AM("7.57.14"), "Sky-Cutting Strike"),
            (S14AM("7.57.08"), "Armor-Breaking Blow"),
            (S14AM("7.57.09"), "Enhance Aura"),
            (S14AM("7.57.10"), "Demonic Lineage"),
            (S14AM("7.57.11"), "Demonic Boost"),
            (S14AM("7.57.12"), "Soul Hack"),
        ],
        "artifact": S14AM("7.57.17"),
        "artifact_box": (220, 245, 500, 525),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "roar-warrior": {
        "popups": [
            (S14AM("7.57.29"), "Elimination Axe"),
            (S14AM("7.57.23"), "Thirst"),
            (S14AM("7.57.25"), "Enhance Great Axe"),
            (S14AM("7.57.26"), "Roar"),
            (S14AM("7.57.27"), "Battle Soul"),
            (S14AM("7.57.28"), "Axe of Greatness"),
        ],
        "artifact": S14AM("7.57.32"),
        "artifact_box": (220, 255, 480, 515),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "monkey-king": {
        "popups": [
            (S14AM("7.57.47"), "Golden Cudgel"),
            (S14AM("7.57.38"), "Stabilizing Cudgel"),
            (S14AM("7.57.39"), "Enhanced Strike"),
            (S14AM("7.57.40"), "Monkey Clone"),
            (S14AM("7.57.44"), "Forest Dance"),
            (S14AM("7.57.45"), "Ruyi Technique"),
        ],
        "artifact": S14AM("7.57.50"),
        "artifact_box": (215, 242, 490, 522),
        "artifact_corner_radius": 12,
        "artifact_popup": None,
    },
    "radiant-envoy": {
        "popups": [
            (S13PM("12.48.10"), "Final Spark"),
            (S13PM("12.48.01"), "Light Binding"),
            (S13PM("12.48.03"), "Enhanced Flash"),
            (S13PM("12.48.05"), "Prismatic Barrier"),
            (S13PM("12.48.07"), "Light Body"),
            (S13PM("12.48.09"), "Beam Charge"),
        ],
        "artifact": S13PM("12.48.12"),
        # Preserve the diagonal wand tips below the player's star row.
        "artifact_box": (225, 250, 485, 520),
        "artifact_corner_radius": 12,
        # 12.48.15 completes the rainbow text; reuse existing shared tier icons.
        "artifact_popup": None,
    },
    "jungle-envoy": {
        "popups": [
            (S13AM("11.50.02"), "Pulse Nova"),
            (S13AM("11.33.30"), "Lightning Storm"),
            (S13AM("11.33.32"), "Enhanced Pulse"),
            (S13AM("11.33.37"), "Demonic Edict"),
            (S13AM("11.33.40"), "Jungle Warden"),
            (S13AM("11.33.41"), "Power Surge"),
        ],
        "artifact": S13AM("11.33.45"),
        # Include the staff's full diagonal art below the player's star.
        "artifact_box": (140, 240, 580, 530),
        "artifact_popup": S13AM("11.33.48"),
    },
    "radiant-paladin": {
        "popups": [
            (S13AM("11.34.14"), "Guardian of Light"),
            (S13AM("11.34.04"), "Sanctity Hammer"),
            (S13AM("11.34.08"), "Illumination"),
            (S13AM("11.34.09"), "Purifying Light"),
            (S13AM("11.34.11"), "Sacred Incarnate"),
            (S13AM("11.34.12"), "Divine Guardian"),
        ],
        "artifact": S13AM("11.34.16"),
        # Keep the book and lightning tips, excluding the player's stars.
        "artifact_box": (190, 240, 560, 570),
        "artifact_popup": S13AM("11.34.19"),
    },
    "holy-healer": {
        "popups": [
            (S13AM("11.37.46"), "Darkness Land"),
            (S13AM("11.37.37"), "Darkness Strike"),
            (S13AM("11.37.38"), "Darkness Befalls"),
            (S13AM("11.37.40"), "Meteor Falls"),
            (S13AM("11.37.42"), "ATK Amplification"),
            (S13AM("11.37.44"), "Darkest Hour"),
        ],
        "artifact": S13AM("11.37.49"),
        # Keep the staff head and lower handle, excluding the player's star.
        "artifact_box": (185, 238, 525, 565),
        "artifact_popup": S13AM("11.37.50"),
    },
    "silence": {
        "popups": [
            (S13AM("11.34.40"), "Silence Domain"),
            (S13AM("11.34.33"), "Wisdom Blade"),
            (S13AM("11.34.35"), "ATK Reduction"),
            (S13AM("11.34.36"), "Magic Curse"),
            (S13AM("11.34.37"), "Arcane Enhanced"),
            (S13AM("11.34.39"), "Energy Drain"),
        ],
        "artifact": S13AM("11.34.42"),
        # Wide ellipse retains both blade tips below the star row.
        "artifact_box": (155, 243, 575, 563),
        # 11.34.46 completes text; existing shared tier icons remain in use.
        "artifact_popup": S13AM("11.34.45"),
    },
    "gunslinger": {
        "popups": [
            (S13AM("11.35.07"), "Snipe"),
            (S13AM("11.34.59"), "Shotgun"),
            (S13AM("11.35.02"), "Quick Snipe"),
            (S13AM("11.35.03"), "Headshot"),
            (S13AM("11.35.05"), "Aim"),
            (S13AM("11.35.06"), "Enhance Snipe"),
        ],
        "artifact": S13AM("11.35.13"),
        "artifact_box": (205, 243, 505, 543),
        "artifact_popup": S13AM("11.35.15"),
    },
    "silver-warrior": {
        "popups": [
            (S13AM("11.37.17"), "Godslayer Strike"),
            (S13AM("11.37.08"), "Dawn Slash"),
            (S13AM("11.37.10"), "Mad Blade"),
            (S13AM("11.37.11"), "Adrenaline"),
            (S13AM("11.37.13"), "Energy Armor"),
            (S13AM("11.37.15"), "Annihilation Blade"),
        ],
        "artifact": S13AM("11.37.20"),
        # Wide ellipse includes the long upper-left tip and the full handle.
        "artifact_box": (155, 243, 555, 553),
        "artifact_popup": S13AM("11.37.22"),
    },
    "dark-knight": {
        "popups": [
            (S13AM("11.35.31"), "Entangle"),
            (S13AM("11.35.33"), "Charge"),
            (S13AM("11.35.35").replace(".png", " 1.png"), "Gloomy Shield"),
            (S13AM("11.35.37"), "Dark Bloodline"),
            (S13AM("11.35.39"), "Undead"),
            (S13AM("11.35.41"), "Darklight Shield"),
        ],
        "artifact": S13AM("11.35.44"),
        # Full sword rectangle below its star; an inscribed ellipse clips its ends.
        "artifact_box": (210, 245, 510, 530),
        "artifact_corner_radius": 24,
        "artifact_popup": S13AM("11.35.46"),
    },
    "arcane-saint": {
        "popups": [
            (S13AM("11.35.59"), "Sage's Gift"),
            (S13AM("11.36.01"), "Energy Penalty"),
            (S13AM("11.36.02"), "Unified"),
            (S13AM("11.36.03"), "Vigorous"),
            (S13AM("11.36.04"), "Guard Bloom"),
            (S13AM("11.36.06"), "Golden Holy Bloom"),
        ],
        "artifact": S13AM("11.36.12"),
        # Include the staff tips and cords while excluding its stars.
        "artifact_box": (205, 245, 505, 535),
        "artifact_corner_radius": 24,
        "artifact_popup": S13AM("11.36.13"),
    },
    "witch-dictator": {
        "popups": [
            (S13AM("11.36.36"), "Frost Echo"),
            (S13AM("11.36.26"), "Frigid Explosion"),
            (S13AM("11.36.28"), "Ultimate Frost"),
            (S13AM("11.36.30"), "Frost Armor"),
            (S13AM("11.36.32"), "ATK Amplification"),
            (S13AM("11.36.34"), "Multifrost"),
        ],
        "artifact": S13AM("11.36.40"),
        "artifact_box": (185, 240, 525, 550),
        "artifact_popup": S13AM("11.36.41"),
    },
    "thrall": {
        "popups": [
            (S13AM("9.27.07"), "Thunder Strike"),
            (S13AM("9.27.12"), "Enhanced Storm"),
            (S13AM("9.27.14"), "Guardian Rune"),
            (S13AM("9.27.17"), "Orc Soul"),
            (S13AM("9.27.19"), "Electric Overload"),
            (S13AM("9.27.21"), "Electric storm"),
        ],
        "artifact": S13AM("9.27.32"),
        # Keep the whole hammer and lightning, excluding the player's stars.
        "artifact_box": (205, 243, 505, 543),
        "artifact_popup": S13AM("9.27.35"),
    },
    "necromancer": {
        "popups": [
            (S13AM("9.07.32"), "Reaper Scythe"),
            (S13AM("9.07.34"), "Dark Pulse"),
            (S13AM("9.07.35"), "Ghost Shield"),
            (S13AM("9.07.36"), "Soul Offering"),
            (S13AM("9.07.37"), "Necro Arts"),
            (S13AM("9.07.39"), "Death Pulse"),
        ],
        "artifact": S13AM("9.07.41"),
        # Include the lantern handle and ghosts, but not the player's stars.
        "artifact_box": (190, 243, 520, 573),
        # 9.19.54 clips the rainbow badge; keep using the existing shared icons.
        "artifact_popup": None,
    },
    "sea-captain": {
        "popups": [
            (S("11.06.07"), "Water Blade"),
            (S("11.06.09"), "Rogue Waves"),
            (S("11.06.11"), "Torrent"),
            (S("11.06.14"), "Steadfast Body"),
            (S("11.06.16"), "Undying"),
            (S("11.06.20"), "Ghost Ship"),
        ],
        "artifact": S("11.06.30"),
        "artifact_popup": S("11.06.28"),
    },
    "nezha": {
        "popups": [
            (S13AM("7.30.32"), "Fire-Tipped Spear"),
            (S13AM("7.30.44"), "Windfire"),
            (S13AM("7.30.45"), "Armillary Sash"),
            (S13AM("7.30.47"), "Threefold Arms"),
            (S13AM("7.30.49"), "Scorching Ember"),
            (S13AM("7.30.51"), "Wind Fire Wheels"),
        ],
        "artifact": S13AM("7.30.59"),
        "artifact_popup": S13AM("7.31.05"),
    },
    "shadow-fiend": {
        "popups": [
            (S13AM("8.54.22"), "Soul Burn"),
            (S13AM("8.54.24"), "Ghost Curse"),
            (S13AM("8.54.25"), "Destructive Gloom"),
            (S13AM("8.54.27"), "Haunted"),
            (S13AM("8.54.29"), "Spiteful Curse"),
            (S13AM("8.54.30"), "Soul Requiem"),
        ],
        "artifact": S13AM("8.54.33"),
        # This 706x1255 capture places the player's stars above the mask.
        "artifact_box": (205, 243, 505, 543),
        # Full ability popup has not been supplied; shared tier icons exist.
        "artifact_popup": None,
    },
}

# Popup geometry (constant across heroes at this capture size).
TALENT_ICON_BOX = (118, 336, 228, 446)  # round icon at the popup's top-left
PANEL_SCAN_X = 110  # column inside the panels used to find the black borders
SMALL_ICON_BOX = (98, 12, 142, 56)  # (x0, dy0, x1, dy1) relative to a panel top
ARTIFACT_BOX = (205, 225, 495, 515)  # weapon disc on the Artifact tab
# Tier diamonds down the left of the artifact popup, in unlock order.
TIER_ROWS = [("purple", 492), ("gold", 620), ("red", 748), ("rainbow", 882)]
TIER_BOX = (92, 152)  # x0, x1; rows are ±30 px around TIER_ROWS


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def circle(img, inset=13):
    """Keep only the inscribed circle (drops the gold max-level chevron)."""
    img = img.convert("RGBA")
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).ellipse((inset, inset, img.width - inset, img.height - inset), fill=255)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, mask=mask)
    return out


def panels(a):
    """Top y of each dark popup panel, found via the black border rows."""
    col = a[:, PANEL_SCAN_X].sum(1)
    black = col < 40
    tops, inrun = [], False
    for y in range(300, a.shape[0] - 300):
        if black[y] and not inrun:
            inrun = True
        elif not black[y] and inrun:
            inrun = False
            tops.append(y)  # first non-black row after a border = panel top
    # borders come in pairs (bottom of one panel, top of the next); keep the
    # ones followed by panel colour rather than background
    return [y for y in tops if a[y + 5, PANEL_SCAN_X].sum() < 200]


def transparent_panel(icon):
    """Flood-fill the dark popup panel from the corners to alpha 0."""
    a = np.asarray(icon.convert("RGBA")).copy()
    h, w = a.shape[:2]
    dark = a[..., :3].sum(-1) < 170
    seen = np.zeros((h, w), bool)
    stack = [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]
    while stack:
        y, x = stack.pop()
        if y < 0 or y >= h or x < 0 or x >= w or seen[y, x] or not dark[y, x]:
            continue
        seen[y, x] = True
        stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    a[seen, 3] = 0
    return keep_centre_component(a)


def trim(img):
    """Crop to the opaque bounding box, then pad to a square so icons share a
    scale when rendered at the same size."""
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    side = max(img.size)
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    out.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return out


def keep_centre_component(a):
    """Drop opaque pixels not connected to the centre (stray text fragments)."""
    h, w = a.shape[:2]
    opaque = a[..., 3] > 0
    keep = np.zeros((h, w), bool)
    stack = [(h // 2, w // 2)]
    while stack:
        y, x = stack.pop()
        if y < 0 or y >= h or x < 0 or x >= w or keep[y, x] or not opaque[y, x]:
            continue
        keep[y, x] = True
        stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    a[~keep, 3] = 0
    return Image.fromarray(a)


def transparent_light(icon):
    """Flood-fill the white popup card from the corners to alpha 0."""
    a = np.asarray(icon.convert("RGBA")).copy()
    h, w = a.shape[:2]
    light = (a[..., :3].min(-1) > 200) & (a[..., :3].max(-1) - a[..., :3].min(-1) < 30)
    seen = np.zeros((h, w), bool)
    stack = [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]
    while stack:
        y, x = stack.pop()
        if y < 0 or y >= h or x < 0 or x >= w or seen[y, x] or not light[y, x]:
            continue
        seen[y, x] = True
        stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    a[seen, 3] = 0
    return Image.fromarray(a)


def saturated(icon):
    a = np.asarray(icon.convert("RGB")).astype(int)
    return int(((a.max(-1) - a.min(-1)) > 80).sum())


def is_core_icon(icon):
    """The core gem fills its box (~620 saturated px); the bonus diamonds are
    smaller (~200-380). Text rows that slip through the panel scan are < 100."""
    return saturated(icon) > 500


def main():
    icons_dir = os.path.join(ROOT, "public/icons")
    os.makedirs(icons_dir, exist_ok=True)
    tier_written = set(os.listdir(icons_dir))
    for hero, cfg in LAYOUT.items():
        needed = [f for f, _ in cfg["popups"]] + [cfg["artifact"]]
        needed.extend(icon["source"] for icon in cfg.get("talent_icons", {}).values())
        if cfg["artifact_popup"]:
            needed.append(cfg["artifact_popup"])
        if any(not os.path.exists(os.path.join(SRC, f)) for f in needed):
            print(f"{hero:14s} skipped (source screenshots not present)")
            continue
        out = os.path.join(ROOT, "public/talents", hero)
        os.makedirs(out, exist_ok=True)
        for file, name in cfg["popups"]:
            path = os.path.join(SRC, file)
            im = Image.open(path).convert("RGB")
            a = np.asarray(im).astype(int)
            icon_cfg = cfg.get("talent_icons", {}).get(name, {})
            icon_source = (Image.open(os.path.join(SRC, icon_cfg["source"])).convert("RGB")
                           if "source" in icon_cfg else im)
            circle(icon_source.crop(icon_cfg.get("box", TALENT_ICON_BOX)),
                   inset=icon_cfg.get("inset", 13)).save(os.path.join(out, f"{slugify(name)}.png"))
            extra = panels(a)[1:]
            found = []
            for top in extra:
                x0, dy0, x1, dy1 = SMALL_ICON_BOX
                icon = im.crop((x0, top + dy0, x1, top + dy1))
                if not is_core_icon(icon):
                    continue  # tier diamonds come from the artifact popup instead
                found.append("core")
                if "core.png" not in tier_written:
                    trim(transparent_panel(icon)).save(os.path.join(icons_dir, "core.png"))
                    tier_written.add("core.png")
            print(f"{hero:14s} {name:16s} panels={len(extra)} {' '.join(found)}")
        if cfg["artifact_popup"]:
            popup = Image.open(os.path.join(SRC, cfg["artifact_popup"])).convert("RGB")
            for tier, y in TIER_ROWS:
                fn = f"artifact-{tier}.png"
                if fn not in tier_written:
                    x0, x1 = TIER_BOX
                    trim(transparent_light(popup.crop((x0, y - 30, x1, y + 30)))).save(os.path.join(icons_dir, fn))
                    tier_written.add(fn)
        art = os.path.join(SRC, cfg["artifact"])
        im = Image.open(art).convert("RGB")
        os.makedirs(os.path.join(ROOT, "public/artifacts"), exist_ok=True)
        crop = im.crop(cfg.get("artifact_box", ARTIFACT_BOX))
        if "artifact_corner_radius" in cfg:
            # Diagonal weapons can extend outside the usual circular mask.
            artifact = crop.convert("RGBA")
            mask = Image.new("L", crop.size, 0)
            ImageDraw.Draw(mask).rounded_rectangle(
                (0, 0, crop.width - 1, crop.height - 1),
                radius=cfg["artifact_corner_radius"], fill=255,
            )
            artifact.putalpha(mask)
        else:
            artifact = circle(crop, inset=0)
        if "artifact_polygon" in cfg:
            # Intersect the normal crop mask with a screenshot-specific edge
            # when progress UI sits beside a protruding weapon tip.
            mask = Image.new("L", crop.size, 0)
            ImageDraw.Draw(mask).polygon(cfg["artifact_polygon"], fill=255)
            alpha = np.minimum(np.asarray(artifact.getchannel("A")), np.asarray(mask))
            artifact.putalpha(Image.fromarray(alpha))
        artifact.save(os.path.join(ROOT, "public/artifacts", f"{hero}.png"))
    print("icons:", ", ".join(sorted(tier_written)))


if __name__ == "__main__":
    main()
