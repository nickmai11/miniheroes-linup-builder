#!/usr/bin/env python3
"""Extract divinity icons + catalog from in-game divinity popups.

Usage:  python3 scripts/slice-divinities.py            (needs Pillow + numpy)

After rerunning, bump ASSET_VERSION in src/lib/asset-version.ts so browsers and
next/image drop their cached copies of replaced icons.

Reads every screenshot in gameplay/divinities/ (the "<X> Divinity" enhance popup:
red title bar, badge on the left, "Level" row, then the stat row), groups the
duplicates by badge + text, matches each group to CATALOG, and writes:

  public/divinities/<slug>.png     the badge, background made transparent
  src/data/divinities.ts           seed rows
  scripts/upsert-divinities.sql    same rows as SQL for syncing Supabase

Naming rule (owner, 2026-09-12): a divinity is named by its stat row without the
leading "All" and without the "Divinity" suffix, e.g. the popup titled
"DMG Reduction Divinity" whose row reads "All DMG Reduction" is just
"DMG Reduction"; the one whose row reads "All Physical RES" is "Physical RES".
`kind` is the popup title without " Divinity".

Screenshots that match no CATALOG entry are listed at the end — add a row for
them (the file name is the group's representative) and rerun.
"""
import glob, os, re, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "gameplay/divinities")
OUT = os.path.join(ROOT, "public/divinities")
TS = os.path.join(ROOT, "src/data/divinities.ts")
SQL = os.path.join(ROOT, "scripts/upsert-divinities.sql")

NB = "\u202f"  # macOS puts a narrow no-break space before "PM" in screenshot names
S = lambda t: f"Screenshot 2026-09-12 at {t}{NB}PM.png"

# (representative screenshot, name, kind). Order = display order.
CATALOG = [
    # ATK / DEF / HP (flat numbers)
    (S("10.42.48"), "ATK", "ATK"),
    (S("10.44.22"), "Mage ATK", "ATK"),
    (S("10.42.00"), "Support ATK", "ATK"),
    ("image.png", "Warrior ATK", "ATK"),
    (S("10.43.15"), "DEF", "DEF"),
    (S("10.46.36"), "Marksman DEF", "DEF"),
    (S("10.42.05"), "HP", "HP"),
    # DMG Increase (%)
    (S("10.42.57"), "DMG Increase", "DMG Increase"),
    (S("10.43.34"), "Physical DMG Boost", "DMG Increase"),
    (S("10.41.50"), "Magic DMG Boost", "DMG Increase"),
    (S("10.41.35"), "Melee DMG Boost", "DMG Increase"),
    (S("10.41.45"), "Ranged DMG Boost", "DMG Increase"),
    # DMG Reduction (%)
    (S("10.41.42"), "DMG Reduction", "DMG Reduction"),
    (S("10.41.09"), "Physical RES", "DMG Reduction"),
    (S("10.42.36"), "Magic RES", "DMG Reduction"),
    (S("10.44.15"), "Melee DMG Reduction", "DMG Reduction"),  # in-game row is cut to "Melee DMG Reduct"
    (S("10.43.57"), "Ranged DMG Reduction", "DMG Reduction"),
    # CRIT (%)
    (S("10.41.22"), "CRIT Rate", "CRIT"),
    (S("10.43.18"), "CRIT Damage", "CRIT"),
    # RES (%)
    (S("10.41.17"), "Anti-Control Rate", "RES"),
    (S("10.42.46"), "Control RES", "RES"),
    (S("10.41.20"), "SPD Reduction RES", "RES"),
    (S("10.41.28"), "CRIT DMG Reduction", "RES"),
    (S("10.41.52"), "Anti-CRIT Rate", "RES"),
    (S("10.42.55"), "Knockback Resist", "RES"),
    # Others (%)
    (S("10.41.47"), "Knockback Effect", "Knockback"),
    (S("10.42.08"), "Heavy Injury", "Weakness"),
    (S("10.42.29"), "ATK SPD", "SPD Boost"),
    (S("10.41.26"), "Healing Effect", "Cleansing"),
    (S("10.41.40"), "Receive Healing", "Cleansing"),
]


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def analyze(path):
    """Locate the popup's red title bar and the blue badge centre. None if absent."""
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    H, W = r.shape
    red = (r > 185) & (g < 130) & (b < 120)
    rows = np.where(red.sum(1) > W * 0.3)[0]
    if len(rows) == 0:
        return None
    bar_top, bar_bot = rows[0], rows[-1]
    cols = np.where(red[bar_top : bar_bot + 1].sum(0) > (bar_bot - bar_top) * 0.5)[0]
    px0, px1 = cols[0], cols[-1]
    pw = px1 - px0
    blue = (b > r + 50) & (b > g + 10) & (b > 120)
    y0, y1 = bar_bot, bar_bot + int(pw * 0.4)
    x0, x1 = px0, px0 + int(pw * 0.35)
    ys, xs = np.where(blue[y0:y1, x0:x1])
    if len(ys) < 300:
        return None
    cx, cy = (xs.min() + xs.max()) / 2 + x0, (ys.min() + ys.max()) / 2 + y0
    rad = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2
    return im, dict(bar=(bar_bot, px0, px1), c=(cx, cy), rad=rad)


def bin_hash(img, size):
    g = np.asarray(img.convert("L").resize(size, Image.LANCZOS)).astype(float)
    return (g > g.mean()).flatten()


def features(im, geo):
    cx, cy = geo["c"]
    rad = geo["rad"]
    bar_bot, px0, px1 = geo["bar"]
    pw = px1 - px0
    R = rad * 1.45
    icon = im.crop((int(cx - R), int(cy - R), int(cx + R), int(cy + R)))
    text = im.crop((int(cx + rad * 1.9), bar_bot + int(pw * 0.03), px1 - int(pw * 0.03), int(cy + rad * 3.1)))
    text = text.resize((520, int(520 * text.height / text.width)), Image.LANCZOS)
    th = text.height
    title = text.crop((0, 0, 300, int(th * 0.30)))
    stat = text.crop((0, int(th * 0.68), 230, th))
    return dict(
        icon=icon,
        hi=bin_hash(icon.resize((96, 96), Image.LANCZOS), (32, 32)),
        ht=bin_hash(title, (64, 10)),
        hs=bin_hash(stat, (96, 14)),
    )


def same(a, b):
    return (a["hi"] != b["hi"]).sum() <= 40 and (a["ht"] != b["ht"]).sum() <= 15 and (a["hs"] != b["hs"]).sum() <= 30


def transparent_outside_badge(icon):
    """Flood-fill the light popup background from the corners to alpha 0."""
    rgba = icon.convert("RGBA")
    a = np.asarray(rgba).copy()
    h, w = a.shape[:2]
    light = (a[..., :3].min(-1) > 150) & (a[..., :3].max(-1) - a[..., :3].min(-1) < 40)
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


def main():
    os.makedirs(OUT, exist_ok=True)
    shots = []
    for p in sorted(glob.glob(os.path.join(SRC, "*.png"))):
        res = analyze(p)
        if res is None:
            continue
        im, geo = res
        shots.append(dict(file=os.path.basename(p), im=im, **features(im, geo)))
    by_file = {s["file"]: s for s in shots}

    reps = []
    for rep_file, name, kind in CATALOG:
        if rep_file not in by_file:
            sys.exit(f"CATALOG representative not found or not a popup: {rep_file}")
        reps.append(dict(rep=by_file[rep_file], name=name, kind=kind, members=[]))

    unmatched = []
    for s in shots:
        for r in reps:
            if same(r["rep"], s):
                r["members"].append(s)
                break
        else:
            unmatched.append(s["file"])

    rows = []
    for r in reps:
        slug = slugify(r["name"])
        best = max(r["members"], key=lambda s: s["icon"].width)  # largest native crop
        transparent_outside_badge(best["icon"]).save(os.path.join(OUT, f"{slug}.png"))
        rows.append(dict(slug=slug, name=r["name"], kind=r["kind"], n=len(r["members"])))
        print(f"{slug:24s} {r['kind']:14s} x{len(r['members'])}")

    with open(TS, "w") as f:
        f.write("/**\n * Divinity catalog read from the owner's in-game popups (gameplay/divinities).\n"
                " * Generated by scripts/slice-divinities.py — edit CATALOG there, not this file.\n */\n")
        f.write("export type DivinitySeed = {\n  slug: string;\n  name: string;\n  kind: string;\n  iconUrl: string;\n};\n\n")
        f.write("export const divinitySeeds: DivinitySeed[] = [\n")
        for r in rows:
            f.write(f'  {{ slug: "{r["slug"]}", name: "{r["name"]}", kind: "{r["kind"]}", iconUrl: "/divinities/{r["slug"]}.png" }},\n')
        f.write("];\n")

    with open(SQL, "w") as f:
        f.write("-- Generated by scripts/slice-divinities.py. Run against Supabase to sync divinities.\n")
        f.write("INSERT INTO divinities (slug, name, kind, icon_url) VALUES\n")
        f.write(",\n".join(f"('{r['slug']}','{r['name']}','{r['kind']}','/divinities/{r['slug']}.png')" for r in rows))
        f.write("\nON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, kind = EXCLUDED.kind, icon_url = EXCLUDED.icon_url;\n")

    print(f"\n{len(rows)} divinities from {len(shots)} popups; {len(unmatched)} unmatched")
    for u in unmatched:
        print("  UNMATCHED:", u)
    if unmatched:
        sys.exit(1)


if __name__ == "__main__":
    main()
