import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_BUILD_PRIORITY,
  RUNE_BUILD_PRIORITIES,
  nextBuildPriority,
  sortByBuildPriority,
} from "../src/lib/build-priorities.ts";
import { loadTypeScript } from "./load-typescript.mjs";

const { buildSchema } = loadTypeScript("src/lib/build-input.ts");
const input = {
  heroId: 1,
  name: "Priority tiers",
  runeAttributeIds: [3, 8],
  weaponAttributeIds: [5],
  coreIds: [9],
};

test("chips cycle through both tiers and then remove the selection", () => {
  let priority;
  const steps = [];
  for (let i = 0; i < 4; i++) {
    priority = nextBuildPriority(priority);
    steps.push(priority);
  }
  assert.deepEqual(steps, ["must", "optional", undefined, "must"]);
});

test("rune chips cycle from Important through existing tiers and removal", () => {
  let priority;
  const steps = [];
  for (let i = 0; i < 5; i++) {
    priority = nextBuildPriority(priority, RUNE_BUILD_PRIORITIES);
    steps.push(priority);
  }
  assert.deepEqual(steps, [
    "important",
    "must",
    "optional",
    undefined,
    "important",
  ]);
});

test("sorting groups tiers while preserving pick order within each tier", () => {
  const selections = [
    { id: 1, priority: "optional" },
    { id: 2, priority: "optional" },
    { id: 3, priority: "must" },
    { id: 4, priority: "must" },
    { id: 5, priority: "optional" },
    { id: 6, priority: "important" },
    { id: 7, priority: "important" },
  ];
  assert.deepEqual(
    sortByBuildPriority(selections).map((item) => item.id),
    [6, 7, 3, 4, 1, 2, 5],
  );
  assert.deepEqual(
    selections.map((item) => item.id),
    [1, 2, 3, 4, 5, 6, 7],
  );
});

test("accepts separate tiers for rune attributes, weapon attributes and cores", () => {
  const data = {
    ...input,
    runePriorities: { 3: "must", 8: "optional" },
    weaponPriorities: { 5: "optional" },
    corePriorities: { 9: "must" },
  };
  const parsed = buildSchema.parse(data);
  for (const key of ["runePriorities", "weaponPriorities", "corePriorities"]) {
    assert.deepEqual(parsed[key], data[key]);
  }
});

test("Important is accepted for runes only", () => {
  const parsed = buildSchema.parse({
    ...input,
    runePriorities: { 3: "important", 8: "must" },
  });
  assert.deepEqual(parsed.runePriorities, { 3: "important", 8: "must" });
  for (const priorities of [
    { weaponPriorities: { 5: "important" } },
    { corePriorities: { 9: "important" } },
    { runePriorities: { 99: "important" } },
  ]) {
    assert.equal(
      buildSchema.safeParse({ ...input, ...priorities }).success,
      false,
    );
  }
});

test("legacy selections remain valid when no explicit tiers are supplied", () => {
  assert.equal(DEFAULT_BUILD_PRIORITY, "optional");
  const parsed = buildSchema.parse(input);
  assert.deepEqual(parsed.runePriorities, {});
  assert.deepEqual(parsed.weaponPriorities, {});
  assert.deepEqual(parsed.corePriorities, {});
});

test("rejects invalid tiers and priority assignments to unselected attributes", () => {
  for (const runePriorities of [
    { 3: "should" },
    { 3: "critical" },
    { 3: null },
    { 99: "must" },
    { 3.5: "must" },
    { "03": "must" },
    { "-1": "must" },
  ]) {
    assert.equal(
      buildSchema.safeParse({ ...input, runePriorities }).success,
      false,
    );
  }
  assert.equal(
    buildSchema.safeParse({ ...input, weaponPriorities: { 3: "must" } })
      .success,
    false,
  );
  assert.equal(
    buildSchema.safeParse({ ...input, corePriorities: { 5: "must" } }).success,
    false,
  );
});
