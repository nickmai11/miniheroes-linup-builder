import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { matchesFishFilters } = loadTypeScript("src/lib/fish-catalog.ts");
const { fishSeeds } = loadTypeScript("src/data/fishes.ts");
const { translateGameLabel } = loadTypeScript("src/lib/i18n/game-labels.ts");
const empty = {
  query: "",
  categories: [],
  areas: [],
  qualities: [],
  specialStats: [],
};
const matching = (filters) =>
  fishSeeds.filter((fish) =>
    matchesFishFilters(fish, { ...empty, ...filters }),
  );

test("empty filters include every fish, including unrecorded quality and area", () => {
  assert.equal(matching({}).length, fishSeeds.length);
  const fish = { ...fishSeeds[0], rarity: null, area: null };
  assert.equal(matchesFishFilters(fish, empty), true);
  assert.equal(
    matchesFishFilters(fish, { ...empty, qualities: ["epic"] }),
    false,
  );
  assert.equal(
    matchesFishFilters(fish, { ...empty, areas: ["Gold Coast"] }),
    false,
  );
});

test("each filter includes the union of its selected options", () => {
  for (const [field, selections] of [
    ["categories", ["Small", "Large"]],
    ["areas", ["Gold Coast", "Jungle Lakes"]],
    ["qualities", ["eternal", "mythic"]],
    ["specialStats", ["Reflect DMG", "Healing Effect"]],
  ]) {
    const individual = selections.map((value) =>
      matching({ [field]: [value] }),
    );
    for (const result of individual) assert.ok(result.length > 0, field);
    const expected = new Set(individual.flat().map((fish) => fish.slug));
    assert.deepEqual(
      new Set(matching({ [field]: selections }).map((fish) => fish.slug)),
      expected,
      field,
    );
  }
});

test("filters combine with one another and multilingual name search", () => {
  const fish = fishSeeds.find((item) => item.slug === "mutated-dragonfish");
  const filters = {
    query: translateGameLabel("vi", "fish", fish),
    categories: ["Small", "Large"],
    areas: ["Gold Coast", "Jungle Lakes"],
    qualities: ["eternal", "mythic"],
    specialStats: ["Reflect DMG", "Healing Effect"],
  };
  assert.deepEqual(
    matching(filters).map((item) => item.slug),
    [fish.slug],
  );
  for (const [field, values] of [
    ["categories", ["Small", "Medium"]],
    ["areas", ["Jungle Lakes"]],
    ["qualities", ["epic", "rare"]],
    ["specialStats", ["none"]],
    ["query", "not a fish name"],
  ]) {
    assert.equal(matching({ ...filters, [field]: values }).length, 0, field);
  }
});

test("special-stat presence options combine with specific stats", () => {
  assert.equal(
    matching({ specialStats: ["any", "none"] }).length,
    fishSeeds.length,
  );
  assert.deepEqual(
    matching({ specialStats: ["any", "Reflect DMG"] }),
    matching({ specialStats: ["any"] }),
  );
  const mixed = matching({ specialStats: ["none", "Reflect DMG"] });
  assert.ok(mixed.some((fish) => fish.specialStats.length === 0));
  assert.ok(mixed.some((fish) => fish.specialStats.includes("Reflect DMG")));
  assert.ok(
    mixed.every(
      (fish) =>
        !fish.specialStats.length || fish.specialStats.includes("Reflect DMG"),
    ),
  );
});
