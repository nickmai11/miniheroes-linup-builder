import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { lineupSchema } = loadTypeScript("src/lib/lineup-input.ts");
const { createLineupDraft } = loadTypeScript("src/lib/lineup-draft.ts");
const valid = () => ({
  name: "Arena",
  slots: [
    { heroId: 1, petIds: [2, 3], relicIds: [4, 5] },
    null,
    null,
    null,
    null,
  ],
});

test("lineups support multiple assignments, empty slots, and optional assignments", () => {
  assert.equal(lineupSchema.safeParse(valid()).success, true);
  const input = valid();
  input.slots[1] = { heroId: 2 };
  assert.deepEqual(lineupSchema.parse(input).slots[1], {
    heroId: 2,
    buildId: null,
    petIds: [],
    relicIds: [],
  });
});

test("a lineup hero may have one saved build, or clear it", () => {
  for (const buildId of [null, 12]) {
    const input = valid();
    input.slots[0].buildId = buildId;
    assert.equal(lineupSchema.parse(input).slots[0].buildId, buildId);
  }
  for (const buildId of [-1, 0, 1.5, "1", [1, 2]]) {
    const input = valid();
    input.slots[0].buildId = buildId;
    assert.equal(lineupSchema.safeParse(input).success, false);
  }
});

test("the same catalog item may be assigned to different heroes", () => {
  const input = valid();
  input.slots[1] = { ...input.slots[0], heroId: 2 };
  assert.equal(lineupSchema.safeParse(input).success, true);
});

test("rejects duplicate heroes, duplicate assignments, and invalid catalog IDs", () => {
  const duplicate = valid();
  duplicate.slots[1] = duplicate.slots[0];
  assert.equal(lineupSchema.safeParse(duplicate).success, false);
  for (const field of ["petIds", "relicIds"]) {
    for (const ids of [[2, 2], [-1], [0], [1.5], ["1"]]) {
      const input = valid();
      input.slots[0][field] = ids;
      assert.equal(lineupSchema.safeParse(input).success, false);
    }
  }
});

test("rejects invalid edit IDs, empty formations, and assignments without a hero", () => {
  for (const id of [0, -1, 1.5, "1"]) {
    assert.equal(lineupSchema.safeParse({ ...valid(), id }).success, false);
  }
  assert.equal(
    lineupSchema.safeParse({ ...valid(), slots: Array(5).fill(null) }).success,
    false,
  );
  assert.equal(
    lineupSchema.safeParse({ ...valid(), slots: [null] }).success,
    false,
  );
  const input = valid();
  delete input.slots[0].heroId;
  assert.equal(lineupSchema.safeParse(input).success, false);
});

test("lineup fishes are optional, ordered, and unique positive catalog IDs", () => {
  assert.deepEqual(lineupSchema.parse(valid()).fishIds, []);
  assert.deepEqual(
    lineupSchema.parse({ ...valid(), fishIds: [3, 1, 2] }).fishIds,
    [3, 1, 2],
  );
  for (const fishIds of [[2, 2], [-1], [0], [1.5], ["1"], null]) {
    assert.equal(
      lineupSchema.safeParse({ ...valid(), fishIds }).success,
      false,
    );
  }
});

const savedLineup = () => ({
  id: 42,
  name: "Arena",
  description: "Keep the formation and notes.",
  createdAt: new Date("2026-09-13T00:00:00Z"),
  fishes: [{ id: 9 }, { id: 3 }],
  slots: [
    {
      id: 7,
      build: { id: 12 },
      pets: [{ id: 4 }, { id: 2 }],
      relics: [{ id: 6 }],
    },
    null,
    { id: 1, build: null, pets: [], relics: [] },
    null,
    null,
  ],
});

test("cloning preserves all ordered assignments and notes without the source save target", () => {
  const source = savedLineup();
  const draft = createLineupDraft(source, true);
  assert.equal(Object.hasOwn(draft, "id"), false);
  assert.equal(draft.name, "Arena (copy)");
  assert.equal(draft.description, source.description);
  assert.deepEqual(draft.fishIds, [9, 3]);
  assert.deepEqual(draft.slots, [
    { heroId: 7, buildId: 12, petIds: [4, 2], relicIds: [6] },
    null,
    { heroId: 1, buildId: null, petIds: [], relicIds: [] },
    null,
    null,
  ]);
  assert.equal(lineupSchema.safeParse(draft).success, true);
  const original = structuredClone(source);
  draft.name = "Different lineup";
  draft.slots[0].petIds.reverse();
  draft.slots[0].relicIds.push(8);
  draft.slots[0].buildId = null;
  draft.slots[2] = null;
  draft.fishIds.pop();
  assert.deepEqual(source, original);
});

test("edit drafts retain their save target while clone names fit the name limit", () => {
  const source = savedLineup();
  source.name = "A".repeat(120);
  const edit = createLineupDraft(source);
  assert.equal(edit.id, source.id);
  assert.equal(edit.name, source.name);
  const clone = createLineupDraft(source, true);
  assert.equal(clone.name.length, 120);
  assert.ok(clone.name.endsWith(" (copy)"));
  assert.equal(lineupSchema.safeParse(clone).success, true);
});
