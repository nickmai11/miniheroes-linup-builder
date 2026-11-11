import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { heroDetailSeeds } from "../src/data/hero-details.ts";

const vi = JSON.parse(
  readFileSync(
    new URL("../src/lib/i18n/game-text-vi.json", import.meta.url),
    "utf8",
  ),
);

const descriptions = new Set(
  Object.values(heroDetailSeeds).flatMap((seed) =>
    [
      ...seed.skills,
      ...(seed.artifact?.bonuses ?? []),
      ...seed.cores,
      ...(seed.awakeningSkills ?? []),
    ]
      .map((item) => item.description)
      .filter(Boolean),
  ),
);
const numbers = (text) => (text.match(/\d+(?:\.\d+)?/g) ?? []).sort();

test("every hero description has a Vietnamese translation with the same numbers", () => {
  const missing = [...descriptions].filter((text) => !Object.hasOwn(vi, text));
  assert.deepEqual(missing, [], "add these to src/lib/i18n/game-text-vi.json");
  for (const text of descriptions)
    assert.deepEqual(numbers(vi[text]), numbers(text), text);
});

test("no translation is left behind for an edited or removed description", () => {
  assert.deepEqual(
    Object.keys(vi).filter((text) => !descriptions.has(text)),
    [],
  );
});
