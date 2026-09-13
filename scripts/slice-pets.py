#!/usr/bin/env python3
"""Extract pet icons and names from the owner's Activated Pets screenshots.

Usage: python3 scripts/slice-pets.py [--catalog-only] (Pillow + numpy)

Writes public/pets/<slug>.png, src/data/pets.ts and scripts/upsert-pets.sql.
CATALOG is the source of truth: screenshot suffix, name, popup-art bounding box.
Only names and icons are recorded, per the owner (2026-09-13).
After replacing existing icons, bump ASSET_VERSION in src/lib/asset-version.ts.
"""
import argparse
from collections import deque
import json
from pathlib import Path
import re

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "gameplay/pets"
OUT = ROOT / "public/pets"

CATALOG = [
    ("04", "Mystic Witch", (274, 5, 437, 198)),
    ("05", "Arcane Lady", (228, 0, 475, 190)),
    ("06", "Doom Fang", (275, 0, 436, 188)),
    ("07", "Emerald Lord", (268, 8, 438, 194)),
    ("07 1", "Scarlet Comet", (267, 0, 461, 193)),
    ("08", "Earth Tyrant", (257, 0, 459, 193)),
    ("09", "Zathum", (282, 49, 426, 176)),
    ("10", "Blaze Monkey", (285, 0, 424, 185)),
    ("10 1", "Mecha Beetle", (281, 49, 425, 192)),
    ("11", "Tinman No.7", (258, 40, 454, 217)),
    ("32", "Stellar Whale", (267, 65, 455, 188)),
    ("33", "Rockturtle", (270, 58, 440, 190)),
    ("34", "Magic Owl", (294, 68, 425, 205)),
    ("35", "Giant Crabs", (289, 57, 427, 194)),
    ("36", "Yoyo Fox", (278, 50, 426, 219)),
    ("37", "Sparky", (290, 58, 426, 196)),
    ("38", "Kindwing", (273, 54, 434, 214)),
    ("38 1", "Mini Shroom", (287, 69, 425, 199)),
    ("39", "Emberling", (294, 52, 424, 210)),
    ("40", "Pea Fish", (296, 69, 423, 197)),
]

# Flat popup/background colours and their antialiased edges. Flood from the
# outside so matching colours enclosed inside the pet remain part of its art.
BACKGROUNDS = [
    ((9, 12, 16), 7), ((8, 8, 16), 7), ((38, 42, 48), 12),
    ((149, 215, 214), 12), ((155, 215, 214), 12), ((149, 215, 206), 12),
    ((160, 212, 214), 12), ((226, 245, 193), 12), ((125, 190, 189), 10),
]
# Title fragments outside the art, in screenshot coordinates.
TITLE_EDGES = {"Arcane Lady": (269, 142), "Tinman No.7": (271, 150),
               "Stellar Whale": (278, 145)}


def filename(suffix):
    seconds, *duplicate = suffix.split()
    return (f"Screenshot 2026-09-13 at 12.54.{seconds}\u202fPM"
            + (" 1" if duplicate else "") + ".png")


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def flood(mask, starts):
    """Consume connected true pixels; return their coordinates."""
    height, width = mask.shape
    queue = deque(starts)
    pixels = []
    while queue:
        y, x = queue.popleft()
        if not (0 <= y < height and 0 <= x < width) or not mask[y, x]:
            continue
        mask[y, x] = False
        pixels.append((y, x))
        queue.extend(((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)))
    return pixels


def extract_icon(frame, name, box, background, confidence):
    left, top, right, bottom = box
    rgb = frame[top:bottom, left:right]
    removable = np.zeros(rgb.shape[:2], dtype=bool)
    for color, tolerance in BACKGROUNDS:
        removable |= np.abs(rgb - color).max(axis=2) <= tolerance
    # Repeated pixels reveal the popup's curved border behind the different
    # pets. Removing that shared UI does not redraw any pet pixels.
    removable |= ((np.abs(rgb - background[top:bottom, left:right]).max(axis=2) <= 8)
                  & (confidence[top:bottom, left:right] >= 4))
    height, width = removable.shape
    edge = ([(0, x) for x in range(width)] + [(height - 1, x) for x in range(width)]
            + [(y, 0) for y in range(height)] + [(y, width - 1) for y in range(height)])
    remaining = np.ones((height, width), dtype=bool)
    for y, x in flood(removable, edge):
        remaining[y, x] = False
    if name in TITLE_EDGES:
        x, y = TITLE_EDGES[name]
        remaining[max(0, y - top):, :max(0, x - left)] = False
    alpha = np.zeros((height, width), dtype=np.uint8)
    for y, x in zip(*np.where(remaining)):
        component = flood(remaining, [(y, x)])
        # Keep detached body parts too (Tinman's hands, Emberling's flame).
        if len(component) >= 20:
            for cy, cx in component:
                alpha[cy, cx] = 255
    icon = Image.fromarray(np.dstack((rgb.astype(np.uint8), alpha)))
    bounds = icon.getbbox()
    if bounds is None:
        raise ValueError(f"Empty pet icon: {name}")
    icon = icon.crop(bounds)
    # Square transparent canvas, retaining source resolution and full art.
    size = max(icon.size) + 12
    canvas = Image.new("RGBA", (size, size))
    canvas.paste(icon, ((size - icon.width) // 2, (size - icon.height) // 2))
    return canvas


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog-only", action="store_true")
    args = parser.parse_args()
    expected = {filename(suffix) for suffix, _, _ in CATALOG}
    actual = {path.name for path in SRC.glob("*.png")}
    if actual != expected:
        raise ValueError(f"Update CATALOG: missing {expected - actual}; unrecorded {actual - expected}")
    if len({slugify(name) for _, name, _ in CATALOG}) != len(CATALOG):
        raise ValueError("Duplicate pet slug")

    if not args.catalog_only:
        frames = []
        for suffix, _, _ in CATALOG:
            with Image.open(SRC / filename(suffix)) as im:
                if im.size != (706, 1255):
                    raise ValueError(f"Recheck crop coordinates: {filename(suffix)}")
                frames.append(np.asarray(im.convert("RGB"))[:220].astype(int))
        frames = np.stack(frames)
        counts = np.stack([(frames == frame).all(axis=3).sum(axis=0) for frame in frames])
        y, x = np.indices(counts.shape[1:])
        background = frames[counts.argmax(axis=0), y, x]
        confidence = counts.max(axis=0)
        OUT.mkdir(parents=True, exist_ok=True)
        for frame, (_, name, box) in zip(frames, CATALOG):
            extract_icon(frame, name, box, background, confidence).save(OUT / f"{slugify(name)}.png")

    rows = [dict(slug=slugify(name), name=name, iconUrl=f"/pets/{slugify(name)}.png")
            for _, name, _ in CATALOG]
    header = ('/**\n * Pet names and icons from the owner\'s gameplay/pets screenshots.\n'
              ' * Generated by scripts/slice-pets.py — edit CATALOG there.\n */\n'
              'export type PetSeed = {\n  slug: string;\n  name: string;\n  iconUrl: string;\n};\n\n'
              'export const petSeeds: PetSeed[] = ')
    (ROOT / "src/data/pets.ts").write_text(header + json.dumps(rows, indent=2) + ';\n')

    def quote(value):
        return "'" + value.replace("'", "''") + "'"

    values = ["(" + ", ".join(quote(row[key]) for key in ("slug", "name", "iconUrl")) + ")"
              for row in rows]
    sql = ('-- Generated by scripts/slice-pets.py. Run against Supabase to sync pet names and icons.\n'
           'INSERT INTO pets (slug, name, icon_url) VALUES\n' + ',\n'.join(values)
           + '\nON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon_url = EXCLUDED.icon_url;\n')
    (ROOT / "scripts/upsert-pets.sql").write_text(sql)
    print(f"Generated {len(rows)} pet names and icons" + (" (catalog only)" if args.catalog_only else ""))


if __name__ == "__main__":
    main()
