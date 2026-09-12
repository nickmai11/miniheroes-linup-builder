#!/usr/bin/env python3
"""
Import rune attributes from the owner's sheets in gameplay/runes/.

Each rune type (Attack / Effect / Energy / Survival) has one CSV export of the
owner's sheet with a table of  Category | Max Value | Description | Analysis
followed by a per-role priority table. The priority table is colour-coded in the
sheet (required / optional / not needed) and the colours do not survive the CSV
export, so only the attribute table is imported.

Writes:
  src/data/rune-attributes.ts        seed used by ensureRuneAttributesSeeded()
  scripts/upsert-rune-attributes.sql same rows as SQL for syncing Supabase

Re-run after editing a CSV. Fix obvious sheet typos in NAME_FIXES below rather
than in the CSVs, so the exports can be replaced verbatim.
"""
import csv
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "gameplay/runes")
TS = os.path.join(ROOT, "src/data/rune-attributes.ts")
SQL = os.path.join(ROOT, "scripts/upsert-rune-attributes.sql")

# Display order of the rune types (matches the in-game Rune tab order the owner uses).
RUNE_TYPES = ["attack", "effect", "energy", "survival"]

# Sheet names -> in-game attribute names (owner, 2026-09-12/13: "Severe Wound" is
# the game's "Heavy Injury Effect", "Healing Done" is "Heal", "Received Healing"
# is "Receive Healing", "Control Avoidance Chance" is "Anti-Control").
NAME_FIXES = {
    "Severe Wound (Anti-Heal)": "Heavy Injury Effect",
    "Recieved Healing": "Receive Healing",
    "Healing Done": "Heal",
    "Control Avoidance Chance": "Anti-Control",
    # Energy runes: in-game names from the owner's Energy Rune popups
    # (gameplay/runes/energy-rune-popup-*.png). "Energy Reduction on Death" has
    # not been seen in a popup yet, so it keeps the sheet name.
    "Energy from Attacking": "ATK Energy Regen",
    "Energy Regeneration": "Energy Regen",
    "Energy Drain on Attack": "ATK Energy Reduction",
    "Energy from Damage Taken": "Energy Regen when attacked",
    "Enery on Kill": "Energy Regen upon Defeat",
    "Energy Remainder": "Energy Surplus",
}


# Truncated / misspelt analysis cells -> full text.
ANALYSIS_FIXES = {
    "Main source of damag": "Main source of damage.",
}


def fix_analysis(text: str) -> str:
    for bad, good in ANALYSIS_FIXES.items():
        if text.endswith(bad):
            text = text[: -len(bad)] + good
    return text


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def clean(text: str) -> str:
    return " ".join(text.replace("’", "'").split())


def parse_max(raw: str):
    """'7.0%' -> (7.0, True); '50' -> (50.0, False)."""
    raw = raw.strip()
    is_percent = raw.endswith("%")
    return float(raw.rstrip("%")), is_percent


def rune_type_of(path: str) -> str:
    m = re.search(r"Runes - (\w+) Runes\.csv$", os.path.basename(path))
    if not m or m.group(1).lower() not in RUNE_TYPES:
        sys.exit(f"unexpected rune CSV name: {path}")
    return m.group(1).lower()


def read_attributes(path: str):
    with open(path, newline="", encoding="utf-8") as f:
        rows = [[c.strip() for c in r] for r in csv.reader(f)]
    # Every row has a leading empty column; the table starts at "Category".
    start = next(i for i, r in enumerate(rows) if len(r) > 1 and r[1] == "Category") + 1
    out = []
    for r in rows[start:]:
        if len(r) < 2 or not r[1]:
            break
        name = NAME_FIXES.get(r[1], r[1])
        value, is_percent = parse_max(r[2])
        desc = clean(r[3])
        if r[1] == "Severe Wound (Anti-Heal)":
            desc += " (anti-heal)"
        out.append(dict(name=name, slug=slugify(name), max_value=value,
                        is_percent=is_percent, description=desc,
                        analysis=fix_analysis(clean(r[5])) if len(r) > 5 else ""))
    return out


def ts_str(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def fmt_num(v: float) -> str:
    return str(int(v)) if v == int(v) else repr(v)


def main():
    files = {rune_type_of(p): p for p in glob.glob(os.path.join(SRC, "Runes - *.csv"))}
    missing = [t for t in RUNE_TYPES if t not in files]
    if missing:
        sys.exit(f"missing rune CSVs for: {', '.join(missing)}")

    rows = []
    slugs = set()
    for rune_type in RUNE_TYPES:
        for i, a in enumerate(read_attributes(files[rune_type])):
            if a["slug"] in slugs:
                sys.exit(f"duplicate attribute slug: {a['slug']}")
            slugs.add(a["slug"])
            rows.append(dict(rune_type=rune_type, sort_order=i, **a))
            unit = "%" if a["is_percent"] else ""
            print(f"{rune_type:9s} {a['slug']:30s} {fmt_num(a['max_value'])}{unit}")

    with open(TS, "w") as f:
        f.write("/**\n * Rune attributes from the owner's sheets (gameplay/runes/*.csv).\n"
                " * Generated by scripts/import-rune-attributes.py — edit the CSVs or the\n"
                " * script, not this file.\n */\n")
        f.write('import type { RuneType } from "@/db/schema";\n\n')
        f.write("export type RuneAttributeSeed = {\n  runeType: RuneType;\n  slug: string;\n"
                "  name: string;\n  maxValue: number;\n  isPercent: boolean;\n"
                "  description: string;\n  analysis: string;\n  sortOrder: number;\n};\n\n")
        f.write("export const runeAttributeSeeds: RuneAttributeSeed[] = [\n")
        for r in rows:
            f.write("  {\n")
            f.write(f'    runeType: "{r["rune_type"]}",\n')
            f.write(f'    slug: "{r["slug"]}",\n')
            f.write(f"    name: {ts_str(r['name'])},\n")
            f.write(f"    maxValue: {fmt_num(r['max_value'])},\n")
            f.write(f"    isPercent: {'true' if r['is_percent'] else 'false'},\n")
            f.write(f"    description: {ts_str(r['description'])},\n")
            f.write(f"    analysis: {ts_str(r['analysis'])},\n")
            f.write(f"    sortOrder: {r['sort_order']},\n")
            f.write("  },\n")
        f.write("];\n")

    with open(SQL, "w") as f:
        f.write("-- Generated by scripts/import-rune-attributes.py. Run against Supabase to sync rune attributes.\n")
        f.write("INSERT INTO rune_attributes (rune_type, slug, name, max_value, is_percent, description, analysis, sort_order) VALUES\n")
        f.write(",\n".join(
            f"({sql_str(r['rune_type'])},{sql_str(r['slug'])},{sql_str(r['name'])},{fmt_num(r['max_value'])},"
            f"{'true' if r['is_percent'] else 'false'},{sql_str(r['description'])},{sql_str(r['analysis'])},{r['sort_order']})"
            for r in rows))
        f.write("\nON CONFLICT (slug) DO UPDATE SET rune_type = EXCLUDED.rune_type, name = EXCLUDED.name,"
                " max_value = EXCLUDED.max_value, is_percent = EXCLUDED.is_percent,"
                " description = EXCLUDED.description, analysis = EXCLUDED.analysis,"
                " sort_order = EXCLUDED.sort_order;\n")

    print(f"\n{len(rows)} rune attributes across {len(RUNE_TYPES)} rune types")


if __name__ == "__main__":
    main()
