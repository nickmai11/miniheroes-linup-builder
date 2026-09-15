import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { baitSeeds } = loadTypeScript("src/data/baits.ts");
const { fishSeeds } = loadTypeScript("src/data/fishes.ts");

test("ten screenshot-backed baits retain their displayed category bonuses", () => {
  assert.equal(baitSeeds.length, 10);
  assert.equal(new Set(baitSeeds.map((bait) => bait.name)).size, 10);
  for (const bait of baitSeeds) {
    assert.ok(existsSync(`public${bait.iconUrl}`));
    assert.ok(bait.description.length > 0);
  }
  assert.deepEqual(baitSeeds.find((bait) => bait.slug === "mealworm").bonuses, [
    { name: "Small Fish Hunter", percent: 35 },
    { name: "Mastery", percent: 10 },
  ]);
  assert.deepEqual(
    baitSeeds.find((bait) => bait.slug === "earthworm").bonuses,
    [{ name: "Small Fish Hunter", percent: 30 }],
  );
});

test("only the sixteen explicitly assigned fishes have a catalog bait", () => {
  const assigned = fishSeeds.filter((fish) => fish.bait !== null);
  assert.equal(assigned.length, 16);
  assert.equal(fishSeeds.filter((fish) => fish.bait === null).length, 114);
  for (const fish of assigned) {
    const bait = baitSeeds.find((bait) => bait.name === fish.bait);
    assert.ok(bait, fish.name);
    assert.equal(bait.fishType, fish.fishType, fish.name);
  }
  assert.equal(
    fishSeeds.find((fish) => fish.slug === "green-crab").bait,
    "Mayfly Bait",
  );
  assert.equal(fishSeeds.find((fish) => fish.slug === "lemon-fish").bait, null);
  const migration = readFileSync("drizzle/0028_bait_catalog.sql", "utf8");
  assert.ok(
    migration.indexOf("INSERT INTO baits") <
      migration.indexOf('ADD CONSTRAINT "fishes_bait_baits_name_fk"'),
  );
  assert.ok(migration.includes("WHERE bait = 'Mayfly'"));
});
