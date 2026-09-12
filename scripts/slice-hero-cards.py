#!/usr/bin/env python3
"""Slice hero portraits out of in-game Archive screenshots.

Usage:  python3 scripts/slice-hero-cards.py            (needs Pillow + numpy)

Reads  gameplay/heroes/<file>  for each entry in LAYOUT,
writes public/heroes/<slug>.png, regenerates src/data/heroes.ts, and writes
scripts/upsert-heroes.sql for syncing Supabase. See docs/mini-heroes-magic-throne.md.

After re-slicing, bump ASSET_VERSION in src/lib/asset-version.ts so
browsers and next/image drop their cached copies.
"""
import re, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = "gameplay/heroes"
OUT = "public/heroes"
W, M, G, U = "warrior", "marksman", "mage", "support"

# One entry per screenshot: (file, names in reading order, roles, rarity).
# Role = card badge (orange sword=warrior, green bow=marksman, blue staff=mage,
# purple shield=support). Rarity = card colour (red=mythic, gold=legend, purple=epic).
LAYOUT = [
    ("image.png", ["Monkey King","Baphomet","White Ox","Swordevil","Wine Immortal","Dark Knight","Lucifer","Silver Warrior","Sea Captain"], [W]*9, "mythic"),
    ("image copy.png", ["Nezha","Swordmaster","Earthbreaker","Holy Healer","Snowoman","Silence","Lady Pan","Radiant Paladin","Warlock"], [W,W,W,U,U,U,U,U,U], "mythic"),
    ("image copy 2.png", ["Arcane Saint","Thrall","Necromancer","Dark Shaman","Shadow Master","Captain Pilot","Gunslinger","Medusa","Li Bai"], [U,U,U,U,M,M,M,M,M], "mythic"),
    ("image copy 3.png", ["Bone Archer","Shadow Fiend","Templar","Darkin Hunter","Two-Headed Dragon","Abyssal Queen","Witch Dictator","Iron Fan Princess","Hela"], [M,M,M,M,G,G,G,G,G], "mythic"),
    ("image copy 4.png", ["Foxy Spirit","Jungle Envoy","Observer","Radiant Envoy"], [G]*4, "mythic"),
    ("image copy 5.png", ["Whaley Imp","Ironblade Mixed-Race","Masked Ninja","Whirlpool Ninja","Skeleton King","Soul Doll","Little Deer","Diva","Mermaid Princess"], [W]*6+[U]*3, "legend"),
    ("image copy 6.png", ["Moon Goddess","Hidden Ninja","Cowboy Killer","Red Hood","Otherworld Prisoner"], [M,M,M,G,G], "legend"),
    ("image copy 7.png", ["Mars","GooGoo Fish","Roar Warrior","Radiant Angel","Wizard","Jungle Archer","Snow Hunter","Loli","Fire Sorceress"], [W,W,W,U,U,M,M,M,G], "epic"),
    ("image copy 8.png", ["Little Goblin","Bamboo Hat"], [G,G], "epic"),
]


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def runs(mask, minlen):
    """Contiguous True runs of at least minlen, as (start, end) pairs."""
    out, start = [], None
    for i, v in enumerate(list(mask) + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= minlen:
                out.append((start, i))
            start = None
    return out


def find_cards(a):
    """Card bounding boxes in reading order, found via the flat grey gutters."""
    r, g, b = (a[..., i].astype(int) for i in range(3))
    v = (r + g + b) // 3
    grey = (np.abs(r - g) < 14) & (np.abs(g - b) < 14) & (v > 165) & (v < 225)
    fg = ~grey
    boxes = []
    for y0, y1 in runs(fg.mean(axis=1) > 0.18, 150):
        band = fg[y0:y1]
        for x0, x1 in runs(band.mean(axis=0) > 0.6, 120):
            if 150 <= x1 - x0 <= 270 and 200 <= y1 - y0 <= 340:
                boxes.append((x0, y0, x1, y1))
    return boxes


def background_mask(a, rarity):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if rarity == "mythic":
        return (r > 170) & (g < 130) & (b < 110) & (r > g + 60)
    if rarity == "legend":
        return (r > 190) & (g > 140) & (b < 120) & (r > b + 90)
    return (b > 140) & (r > 100) & (g < 140) & (b > g + 40)  # epic / purple


def art_panel(card, rarity):
    """Trim a card to its coloured art panel (drops white frame and name band)."""
    m = background_mask(np.asarray(card).astype(int), rarity)
    ry = np.nonzero(m.mean(axis=1) > 0.12)[0]
    rx = np.nonzero(m.mean(axis=0) > 0.12)[0]
    return card.crop((rx.min(), ry.min(), rx.max() + 1, ry.max() + 1))


def remove_artifact_gem(panel):
    """Paint over the artifact-progress diamond (bottom-left) with a mirrored patch."""
    a = np.asarray(panel).astype(float)
    h, w, _ = a.shape
    x0, x1, y0, y1 = 1, 44, h - 43, h
    tw, th = x1 - x0, y1 - y0
    candidates = [
        a[0:th, x0:x1][::-1],               # top-left corner, flipped vertically
        a[y0:y1, x1:x1 + tw][:, ::-1],      # patch to the right, flipped horizontally
        a[y0:y1, w - tw:w][:, ::-1],        # bottom-right corner, flipped horizontally
        a[th:2 * th, x0:x1][::-1],          # band above, flipped vertically
    ]
    ring = np.concatenate([a[y0 - 3:y0, x0:x1].ravel(), a[y0:y1, x1:x1 + 3].ravel()])

    def seam_error(c):
        edge = np.concatenate([c[0:3].ravel(), c[:, -3:].ravel()])
        return np.abs(edge - ring).mean() + 0.5 * c.std()

    best = min(candidates, key=seam_error)
    mask = Image.new("L", (tw, th), 0)
    ImageDraw.Draw(mask).rectangle((3, 3, tw - 1, th - 1), fill=255)
    mk = np.asarray(mask.filter(ImageFilter.GaussianBlur(3))).astype(float)[..., None] / 255
    a[y0:y1, x0:x1] = a[y0:y1, x0:x1] * (1 - mk) + best * mk
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def write_seed(heroes):
    order = [W, M, G, U]
    label = {W: "Warriors", M: "Marksmen", G: "Mages", U: "Support"}
    rank = {"mythic": 0, "legend": 1, "epic": 2}
    lines = [
        'import type { HeroRarity, HeroRole } from "@/db/schema";', "",
        "export type HeroSeed = {", "  slug: string;", "  name: string;", "  role: HeroRole;",
        "  rarity: HeroRarity;", "  imageUrl: string | null;", "};", "",
        "const img = (slug: string) => `/heroes/${slug}.png`;", "",
        "/**", " * Roster sliced from in-game Archive screenshots (gameplay/heroes).",
        " * Generated by scripts/slice-hero-cards.py — edit LAYOUT there, not this file.",
        " * Role comes from the card badge, rarity from the card colour (red = mythic,",
        " * gold = legend, purple = epic).", " */",
        "export const heroSeeds: HeroSeed[] = [",
    ]
    for role in order:
        lines.append(f"  // {label[role]}")
        for slug, name, r, rar in sorted((h for h in heroes if h[2] == role), key=lambda h: (rank[h[3]], h[1])):
            lines.append(f'  {{ slug: "{slug}", name: "{name}", role: "{r}", rarity: "{rar}", imageUrl: img("{slug}") }},')
        lines.append("")
    lines.append("];")
    open("src/data/heroes.ts", "w").write("\n".join(lines) + "\n")


def write_upsert_sql(heroes):
    values = ",\n".join(
        f"('{s}','{n.replace(chr(39), chr(39)*2)}','{r}','{ra}','/heroes/{s}.png')" for s, n, r, ra in heroes
    )
    open("scripts/upsert-heroes.sql", "w").write(
        "-- Generated by scripts/slice-hero-cards.py. Run against Supabase to sync the roster.\n"
        "INSERT INTO heroes (slug, name, role, rarity, image_url) VALUES\n" + values +
        "\nON CONFLICT (slug) DO UPDATE SET\n"
        "  name = EXCLUDED.name, role = EXCLUDED.role, rarity = EXCLUDED.rarity, image_url = EXCLUDED.image_url;\n"
    )


def main():
    heroes = []
    for file, names, roles, rarity in LAYOUT:
        im = Image.open(f"{SRC}/{file}").convert("RGB")
        boxes = find_cards(np.asarray(im))
        if len(boxes) != len(names):
            sys.exit(f"{file}: found {len(boxes)} cards but LAYOUT lists {len(names)}")
        for box, name, role in zip(boxes, names, roles):
            portrait = remove_artifact_gem(art_panel(im.crop(box), rarity))
            slug = slugify(name)
            portrait.save(f"{OUT}/{slug}.png", optimize=True)
            heroes.append((slug, name, role, rarity))
    slugs = [h[0] for h in heroes]
    if len(set(slugs)) != len(slugs):
        sys.exit("duplicate slug in LAYOUT")
    write_seed(heroes)
    write_upsert_sql(heroes)
    print(f"{len(heroes)} portraits -> {OUT}/, src/data/heroes.ts, scripts/upsert-heroes.sql")


if __name__ == "__main__":
    main()
