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

# hero slug -> {"popups": [(file, talent name), ...],
#               "artifact": Artifact tab, "artifact_popup": the artifact's ability list}
LAYOUT = {
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
            circle(im.crop(TALENT_ICON_BOX)).save(os.path.join(out, f"{slugify(name)}.png"))
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
        artifact.save(os.path.join(ROOT, "public/artifacts", f"{hero}.png"))
    print("icons:", ", ".join(sorted(tier_written)))


if __name__ == "__main__":
    main()
