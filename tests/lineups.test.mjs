import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { lineupSchema } = loadTypeScript("src/lib/lineup-input.ts");
const { createLineupDraft } = loadTypeScript("src/lib/lineup-draft.ts");
const valid = () => ({
  name: "Arena",
  slots: [
    { heroId: 1, petIds: [2, 3], relicIds: [4, 5] },
    { heroId: 2 },
    { heroId: 3 },
    { heroId: 4 },
    { heroId: 5 },
  ],
});

test("five-hero lineups support multiple assignments and optional assignments", () => {
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

test("creating and editing require all five heroes, with optional details left empty", () => {
  for (const id of [undefined, 42]) {
    // Exercise every incomplete arrangement, including an empty last slot.
    for (let mask = 0; mask < 31; mask++) {
      const slots = Array.from({ length: 5 }, (_, i) =>
        mask & (1 << i) ? { heroId: i + 1 } : null,
      );
      const result = lineupSchema.safeParse({ name: "Arena", id, slots });
      assert.equal(result.success, false);
      assert.equal(
        result.error.issues[0].message,
        "Pick all five heroes before saving",
      );
    }
    const slots = Array.from({ length: 5 }, (_, i) => ({ heroId: i + 1 }));
    const result = lineupSchema.parse({ name: "Arena", id, slots });
    assert.equal(result.description, "");
    assert.deepEqual(result.fishSelections, []);
    assert.ok(
      result.slots.every(
        (slot) =>
          slot.buildId === null &&
          slot.petIds.length === 0 &&
          slot.relicIds.length === 0,
      ),
    );
    assert.equal(
      lineupSchema.safeParse({
        name: "Arena",
        id,
        slots: [...slots, { heroId: 6 }],
      }).success,
      false,
    );
  }
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

test("legacy fish IDs default to one copy and preserve selection order", () => {
  assert.deepEqual(lineupSchema.parse(valid()).fishSelections, []);
  assert.deepEqual(
    lineupSchema.parse({ ...valid(), fishIds: [3, 1, 2] }).fishSelections,
    [
      { fishId: 3, quantity: 1 },
      { fishId: 1, quantity: 1 },
      { fishId: 2, quantity: 1 },
    ],
  );
  for (const fishIds of [[2, 2], [-1], [0], [1.5], ["1"], null]) {
    assert.equal(
      lineupSchema.safeParse({ ...valid(), fishIds }).success,
      false,
    );
  }
});

test("each selected fish allows 1–4 copies without a total selection limit", () => {
  const fishSelections = [
    { fishId: 5, quantity: 4 },
    { fishId: 2, quantity: 3 },
    { fishId: 4, quantity: 2 },
    { fishId: 1, quantity: 1 },
    { fishId: 3, quantity: 4 },
  ];
  assert.deepEqual(
    lineupSchema.parse({ ...valid(), fishSelections }).fishSelections,
    fishSelections,
  );
  assert.deepEqual(
    lineupSchema.parse({ ...valid(), fishSelections: [{ fishId: 1 }] })
      .fishSelections,
    [{ fishId: 1, quantity: 1 }],
  );
  assert.deepEqual(
    lineupSchema.parse({ ...valid(), fishIds: [1], fishSelections: [] })
      .fishSelections,
    [],
    "Clearing current selections takes precedence over legacy IDs",
  );
});

test("rejects invalid quantities, invalid fish IDs, and duplicate fish selections", () => {
  const invalidSelections = [
    ...[0, -1, 5, 1.5, "2", null, NaN, Infinity].map((quantity) => [
      { fishId: 1, quantity },
    ]),
    ...[0, -1, 1.5, "1", null].map((fishId) => [{ fishId, quantity: 1 }]),
    [
      { fishId: 1, quantity: 1 },
      { fishId: 1, quantity: 2 },
    ],
    null,
  ];
  for (const fishSelections of invalidSelections) {
    assert.equal(
      lineupSchema.safeParse({ ...valid(), fishSelections }).success,
      false,
    );
  }
});

const savedLineup = () => ({
  id: 42,
  name: "Arena",
  description: "Keep the formation and notes.",
  createdAt: new Date("2026-09-13T00:00:00Z"),
  fishes: [
    { id: 9, quantity: 4 },
    { id: 3, quantity: 2 },
  ],
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
  assert.deepEqual(draft.fishSelections, [
    { fishId: 9, quantity: 4 },
    { fishId: 3, quantity: 2 },
  ]);
  assert.deepEqual(draft.slots, [
    { heroId: 7, buildId: 12, petIds: [4, 2], relicIds: [6] },
    null,
    { heroId: 1, buildId: null, petIds: [], relicIds: [] },
    null,
    null,
  ]);
  assert.equal(lineupSchema.safeParse(draft).success, false);
  // Older incomplete lineups still open as drafts; fill their empty slots to save.
  for (const i of [1, 3, 4]) draft.slots[i] = { heroId: i + 10 };
  assert.equal(lineupSchema.safeParse(draft).success, true);
  const original = structuredClone(source);
  draft.name = "Different lineup";
  draft.slots[0].petIds.reverse();
  draft.slots[0].relicIds.push(8);
  draft.slots[0].buildId = null;
  draft.slots[2] = null;
  draft.fishSelections[0].quantity = 1;
  draft.fishSelections.pop();
  assert.deepEqual(source, original);
});

test("edit drafts retain their save target while clone names fit the name limit", () => {
  const source = savedLineup();
  source.name = "A".repeat(120);
  const edit = createLineupDraft(source);
  assert.equal(edit.id, source.id);
  assert.equal(edit.name, source.name);
  assert.deepEqual(edit.fishSelections, [
    { fishId: 9, quantity: 4 },
    { fishId: 3, quantity: 2 },
  ]);
  const clone = createLineupDraft(source, true);
  assert.equal(clone.name.length, 120);
  assert.ok(clone.name.endsWith(" (copy)"));
  for (const i of [1, 3, 4]) clone.slots[i] = { heroId: i + 10 };
  assert.equal(lineupSchema.safeParse(clone).success, true);
});
