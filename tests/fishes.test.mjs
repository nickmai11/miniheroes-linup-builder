import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { fishSeeds } = loadTypeScript("src/data/fishes.ts");

test("fish catalog includes all seven areas and preserves recorded details", () => {
  assert.equal(fishSeeds.length, 130);
  assert.equal(new Set(fishSeeds.map((fish) => fish.slug)).size, 130);
  assert.deepEqual(
    Object.fromEntries(
      [...new Set(fishSeeds.map((fish) => fish.area))].map((area) => [
        area,
        fishSeeds.filter((fish) => fish.area === area).length,
      ]),
    ),
    {
      "Gold Coast": 21,
      "Moonlight Canyon": 16,
      "Snowy Mountain": 18,
      "Desert Beach": 17,
      "Frost Land": 19,
      "Jungle Lakes": 19,
      "Idyllic Paradise": 20,
    },
  );
  const find = (name) => fishSeeds.find((fish) => fish.name === name);
  assert.deepEqual(find("Little Goldfish").stats, ["Mage HP"]);
  assert.equal(find("Little Goldfish").bait, null);
  assert.deepEqual(find("Ice Crystal Arhat Fish").stats, [
    "Marksman ATK",
    "HP",
  ]);
  assert.deepEqual(find("Marten's Pearl Oyster"), {
    slug: "marten-s-pearl-oyster",
    name: "Marten's Pearl Oyster",
    area: "Idyllic Paradise",
    fishType: "Aquatic",
    collection: "Sweetie Sweetie",
    stats: ["Warrior HP", "DMG Reduction", "Heavy Injury Effect"],
    bait: null,
  });
  assert.equal(find("Mutated Dragonfish").bait, "Mudskipper");
  assert.equal(find("Beast Fang"), undefined);
});

test("fish importer excludes collectibles and rejects ambiguous or malformed input", () => {
  execFileSync("python3", [
    "-c",
    `
import importlib.util
from pathlib import Path
import shutil
import tempfile

spec = importlib.util.spec_from_file_location("fish_import", "scripts/import-fishes.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
with tempfile.TemporaryDirectory() as tmp:
    directory = Path(tmp)
    for source in Path("gameplay/fishes").glob("*.csv"):
        shutil.copy(source, directory / source.name)
    (directory / "Fish Guide - Collectibles.csv").write_text("Name,Collection Name\\nBeast Fang,Forest Permit\\n")
    assert len(module.read_fishes(directory)) == 130
    source = directory / "Fish Guide - Gold Coast.csv"
    original = source.read_text()
    source.write_text(original + "\\n" + original.splitlines()[1] + "\\n")
    try:
        module.read_fishes(directory)
        raise AssertionError("Duplicate fish should fail")
    except ValueError as error:
        assert "duplicate fish" in str(error)
    source.write_text("Name,Collection Name\\nBeast Fang,Forest Permit\\n")
    try:
        module.read_fishes(directory)
        raise AssertionError("Collectibles header should fail")
    except ValueError as error:
        assert "expected fish sheet columns" in str(error)
`,
  ]);
});
