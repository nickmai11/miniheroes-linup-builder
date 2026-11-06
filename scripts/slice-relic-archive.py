#!/usr/bin/env python3
"""Slice the 28 relic icons that are not in image.png from the two Relic Archive
screenshots (gameplay/relics/archive-2026-11-06-{1,2}.png, 1080x1920, Kong's
account) into public/relics/<slug>.png at the catalog's 101px size.

Run: python3 scripts/slice-relic-archive.py (requires Pillow). The eight icons
from scripts/slice-relics.py are left alone. Tile centres are the archive grid
(columns 184/362/540/716/894, rows per screenshot), read 2026-11-06.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "gameplay/relics"
OUTPUT = ROOT / "public/relics"
COLS = (184, 362, 540, 716, 894)
# screenshot -> row y -> names left to right
GRID = {
    "archive-2026-11-06-1.png": {
        516: ["heart-of-the-dragon", "crystalline-aegis", "eternal-armor", "deathbringer-ballista", "divine-radiance"],
        684: ["staff-of-annihilation", "crystal-tower", "hourglass-of-chaos"],
        1390: ["broadsword", "buckler", "dragon-seal", "memorial-stele", "ruby-cup"],
    },
    "archive-2026-11-06-2.png": {
        580: ["heart-of-cleansing", "tideblade", "arcane-key"],
        850: ["puppet-doll", "beast-totem", "assembly-flag", "tribal-goblet", "bone-scepter"],
        1016: ["mithril-axe"],
        1288: ["bronze-mirror", "beast-bone", "limestone", "bronze-dagger", "bone-saw"],
        1454: ["stone-hammer"],
    },
}

for file, rows in GRID.items():
    image = Image.open(SOURCE / file).convert("RGBA")
    for y, names in rows.items():
        for x, slug in zip(COLS, names):
            tile = image.crop((x - 66, y - 66, x + 66, y + 66)).resize((101, 101), Image.LANCZOS)
            tile.save(OUTPUT / f"{slug}.png")
            print(slug)
