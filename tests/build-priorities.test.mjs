import assert from "node:assert/strict";
import test from "node:test";
import {
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

test("chips cycle through all three tiers and then remove the selection", () => {
  let priority;
  const steps = [];
  for (let i = 0; i < 5; i++) {
    priority = nextBuildPriority(priority);
    steps.push(priority);
  }
  assert.deepEqual(steps, ["must", "should", "optional", undefined, "must"]);
});

test("sorting groups tiers while preserving pick order within each tier", () => {
  const selections = [
    { id: 1, priority: "optional" },
    { id: 2, priority: "should" },
    { id: 3, priority: "must" },
    { id: 4, priority: "must" },
    { id: 5, priority: "should" },
  ];
  assert.deepEqual(
    sortByBuildPriority(selections).map((item) => item.id),
    [3, 4, 2, 5, 1],
  );
  assert.deepEqual(
    selections.map((item) => item.id),
    [1, 2, 3, 4, 5],
  );
});

test("accepts separate tiers for rune attributes, weapon attributes and cores", () => {
  const data = {
    ...input,
    runePriorities: { 3: "must", 8: "optional" },
    weaponPriorities: { 5: "should" },
    corePriorities: { 9: "must" },
  };
  const parsed = buildSchema.parse(data);
  for (const key of ["runePriorities", "weaponPriorities", "corePriorities"]) {
    assert.deepEqual(parsed[key], data[key]);
  }
});

test("legacy selections remain valid when no explicit tiers are supplied", () => {
  const parsed = buildSchema.parse(input);
  assert.deepEqual(parsed.runePriorities, {});
  assert.deepEqual(parsed.weaponPriorities, {});
  assert.deepEqual(parsed.corePriorities, {});
});

test("rejects invalid tiers and priority assignments to unselected attributes", () => {
  for (const runePriorities of [
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
