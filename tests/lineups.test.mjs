import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { lineupSchema } = loadTypeScript("src/lib/lineup-input.ts");
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
