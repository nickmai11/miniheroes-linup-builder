import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";
import { matchBuildCores } from "../src/lib/build-cores.ts";

const { buildSchema } = loadTypeScript("src/lib/build-input.ts");

const empty = {
  heroId: 1,
  name: "Core priorities",
  runeAttributeIds: [],
  weaponAttributeIds: [],
};

test("a build can consist entirely of cores, preserving priority order", () => {
  assert.deepEqual(
    buildSchema.parse({ ...empty, coreIds: [8, 3] }).coreIds,
    [8, 3],
  );
  assert.equal(buildSchema.safeParse({ ...empty, coreIds: [] }).success, false);
});

test("existing rune and weapon builds do not require cores", () => {
  assert.deepEqual(
    buildSchema.parse({ ...empty, runeAttributeIds: [2] }).coreIds,
    [],
  );
  assert.deepEqual(
    buildSchema.parse({ ...empty, weaponAttributeIds: [4] }).coreIds,
    [],
  );
});

test("core selections must be positive integer ids within the input limit", () => {
  for (const coreIds of [[0], [-1], [1.5], ["1"], Array(201).fill(1)]) {
    assert.equal(buildSchema.safeParse({ ...empty, coreIds }).success, false);
  }
});

test("imports map to the destination hero's ids while retaining source priority", () => {
  const result = matchBuildCores(
    [{ name: "Brawler's Boots" }, { name: "Cavalier Helm" }],
    [
      { id: 30, name: "Cavalier Helm" },
      { id: 40, name: "Brawler's Boots" },
    ],
  );
  assert.deepEqual(result, { coreIds: [40, 30], skippedCoreNames: [] });
});

test("imports report unmatched cores without substituting another bonus", () => {
  assert.deepEqual(
    matchBuildCores(
      [
        { name: "Swift Longbow" },
        { name: "Cavalier Helm" },
        { name: "Arrow Core" },
      ],
      [{ id: 30, name: "Cavalier Helm" }],
    ),
    { coreIds: [30], skippedCoreNames: ["Swift Longbow", "Arrow Core"] },
  );
});

test("unrecorded heroes have no importable cores; repeated names are not duplicated", () => {
  const source = [{ name: "Arrow Core" }, { name: "Arrow Core" }];
  assert.deepEqual(matchBuildCores(source, []), {
    coreIds: [],
    skippedCoreNames: ["Arrow Core"],
  });
  assert.deepEqual(matchBuildCores(source, [{ id: 12, name: "Arrow Core" }]), {
    coreIds: [12],
    skippedCoreNames: [],
  });
  assert.deepEqual(matchBuildCores([], []), {
    coreIds: [],
    skippedCoreNames: [],
  });
});
