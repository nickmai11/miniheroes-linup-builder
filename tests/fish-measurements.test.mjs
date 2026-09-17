import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";

const { fishStatMaximum } = loadTypeScript("src/lib/fish-measurements.ts");
const { fishMeasurementSeeds } = loadTypeScript(
  "src/data/fish-measurements.ts",
);
const { fishSeeds } = loadTypeScript("src/data/fishes.ts");
const { createI18n } = loadTypeScript("src/lib/i18n/messages.ts");
const squid = {
  ...fishSeeds.find((fish) => fish.slug === "fin-squid"),
  ...fishMeasurementSeeds["fin-squid"],
  id: 1,
};

test("screenshot ratios calculate all maximums with independent percentage scaling", () => {
  assert.equal(fishStatMaximum("Warrior ATK", 643.2, squid.statSample), 2997);
  assert.equal(fishStatMaximum("Warrior ATK", 1286.4, squid.statSample), 5994);
  assert.equal(fishStatMaximum("Warrior ATK", 724.31, squid.statSample), 3375);
  assert.equal(
    fishStatMaximum("DMG Increase", 724.31, squid.statSample, true),
    2.77,
  );
  assert.equal(
    fishStatMaximum("Magic DMG Boost", 724.31, squid.statSample, true),
    4.3,
  );
  // Going back to the original size must not use any rounded intermediate maximum.
  assert.equal(fishStatMaximum("Warrior ATK", 643.2, squid.statSample), 2997);
  for (const [slug, measurement] of Object.entries(fishMeasurementSeeds)) {
    const fish = fishSeeds.find((item) => item.slug === slug);
    assert.deepEqual(Object.keys(measurement.statSample.stats), fish.stats);
  }
  const snail = fishMeasurementSeeds["rainbow-snail"];
  assert.equal(fishStatMaximum("Crit DMG", 8.1, snail.statSample, true), 9);
});

test("missing or invalid measurements stay unknown and genuine zero stays zero", () => {
  for (const size of [null, undefined, 0, -1, NaN, Infinity]) {
    assert.equal(fishStatMaximum("Warrior ATK", size, squid.statSample), null);
  }
  assert.equal(fishStatMaximum("HP", 10, squid.statSample), null);
  assert.equal(fishStatMaximum("HP", 10, null), null);
  assert.equal(
    fishStatMaximum("HP", 10, { sizeCm: 0, stats: { HP: 1 } }),
    null,
  );
  assert.equal(fishStatMaximum("HP", 10, { sizeCm: 5, stats: { HP: 0 } }), 0);
});

function actionHarness({ admin = true, fish = squid, failure = false } = {}) {
  const writes = [];
  const invalidations = [];
  let reads = 0;
  const { updateFishMeasurements } = loadTypeScript(
    "src/app/fishes/actions.ts",
    {
      "@/db": {
        schema: { fishes: { id: "id" } },
        db: {
          select: () => {
            reads++;
            return {
              from: () => ({ where: async () => (fish ? [fish] : []) }),
            };
          },
          update: () => ({
            set: (values) => ({
              where: async () => {
                if (failure) throw new Error("DB offline");
                writes.push(values);
              },
            }),
          }),
        },
      },
      "drizzle-orm": { eq: () => ({}) },
      "@/lib/editing": {
        canEditContent: async () => admin,
        EDITING_ERROR: "Admin required",
      },
      "@/lib/app-access": { requireAppAccess: async () => {} },
      "next/cache": { revalidatePath: (...args) => invalidations.push(args) },
    },
  );
  return {
    save: (form) => updateFishMeasurements({}, form),
    writes,
    invalidations,
    reads: () => reads,
  };
}

function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    id: "1",
    bestSizeCm: "800",
    ...overrides,
  }))
    data.set(key, value);
  return data;
}

test("only admins can save; a best-record update keeps original ratio evidence", async () => {
  const denied = actionHarness({ admin: false });
  assert.deepEqual(await denied.save(form()), { error: "Admin required" });
  assert.equal(denied.reads(), 0);
  assert.deepEqual(denied.writes, []);
  const allowed = actionHarness();
  assert.deepEqual(
    await allowed.save(
      form({
        sampleSizeCm: "1",
        "stat:Warrior ATK": "999",
        statSample: JSON.stringify({
          sizeCm: 1,
          stats: { "Warrior ATK": 999 },
        }),
        maxValue: "999",
      }),
    ),
    { saved: true },
  );
  assert.deepEqual(allowed.writes, [{ bestSizeCm: 800 }]);
  assert.deepEqual(allowed.invalidations, [
    ["/fishes"],
    ["/lineups", "layout"],
  ]);
});

test("invalid sizes and missing fish cannot write or report success", async () => {
  for (const overrides of [
    { bestSizeCm: "" },
    { bestSizeCm: "-1" },
    { bestSizeCm: "Infinity" },
    { bestSizeCm: "NaN" },
  ]) {
    const harness = actionHarness();
    assert.ok(
      (await harness.save(form(overrides))).error,
      JSON.stringify(overrides),
    );
    assert.deepEqual(harness.writes, []);
    assert.deepEqual(harness.invalidations, []);
  }
  for (const options of [{ fish: null }, { failure: true }]) {
    const harness = actionHarness(options);
    assert.ok((await harness.save(form())).error);
    assert.deepEqual(harness.invalidations, []);
  }
});

test("a best-record-only submission never clears or replaces a sample", async () => {
  for (const statSample of [null, squid.statSample]) {
    const harness = actionHarness({ fish: { ...squid, statSample } });
    assert.deepEqual(await harness.save(form()), { saved: true });
    assert.deepEqual(harness.writes, [{ bestSizeCm: 800 }]);
  }
});

test("catalog exposes localized maximums to viewers and editing only to admins", () => {
  for (const locale of ["en", "vi"]) {
    const i18n = createI18n(locale);
    const { FishCatalog } = loadTypeScript("src/app/fishes/fish-catalog.tsx", {
      "@/lib/i18n/client": { useI18n: () => i18n },
      "./actions": { updateFishMeasurements: async () => ({}) },
    });
    for (const canEdit of [false, true]) {
      const html = renderToStaticMarkup(
        createElement(FishCatalog, { fishes: [squid], canEdit }),
      );
      assert.ok(html.includes(`(${i18n.formatNumber(3375)})`));
      assert.ok(html.includes(`(${i18n.formatNumber(2.77)}%)`));
      assert.equal(html.includes('name="bestSizeCm"'), canEdit);
      assert.equal(html.includes('name="sampleSizeCm"'), false);
      assert.equal(html.includes('name="stat:'), false);
      assert.equal(html.includes(i18n.t("Save highest record")), canEdit);
    }
  }
});

test("catalog refresh does not overwrite administrator measurements", async () => {
  let inserted;
  let conflict;
  const { ensureFishesSeeded } = loadTypeScript("src/lib/fishes.ts", {
    "@/db": {
      schema: { fishes: { slug: "slug" } },
      db: {
        insert: () => ({
          values: (values) => {
            inserted = values;
            return {
              onConflictDoUpdate: async (options) => {
                conflict = options;
              },
            };
          },
        }),
      },
    },
    "@/lib/baits": { ensureBaitsSeeded: async () => {} },
  });
  await ensureFishesSeeded();
  assert.deepEqual(
    inserted.find((fish) => fish.slug === "fin-squid").statSample,
    squid.statSample,
  );
  assert.equal(Object.hasOwn(conflict.set, "bestSizeCm"), false);
  assert.equal(Object.hasOwn(conflict.set, "statSample"), false);
});
