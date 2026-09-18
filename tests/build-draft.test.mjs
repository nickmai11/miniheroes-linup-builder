import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";

const { createBuildDraft } = loadTypeScript("src/lib/build-draft.ts");
const { buildSchema } = loadTypeScript("src/lib/build-input.ts");
const savedBuild = () => ({
  id: 42,
  heroId: 7,
  name: "Arena",
  notes: "Keep the skill priorities.",
  runes: [
    { id: 8, priority: "must" },
    { id: 3, priority: "important" },
  ],
  weapons: [{ id: 6, priority: "optional" }],
  cores: [
    { id: 9, priority: "important" },
    { id: 2, priority: "must" },
  ],
});

function saveInput(draft) {
  return {
    id: draft.id,
    heroId: 7,
    name: draft.name,
    notes: draft.notes,
    runeAttributeIds: draft.runeIds,
    weaponAttributeIds: draft.weaponIds,
    coreIds: draft.coreIds,
    runePriorities: draft.runePriorities,
    weaponPriorities: draft.weaponPriorities,
    corePriorities: draft.corePriorities,
  };
}

test("cloning preserves all selections, their order and priorities, without a save target", () => {
  const source = savedBuild();
  const copy = createBuildDraft(source, true);
  assert.equal(Object.hasOwn(copy, "id"), false);
  assert.deepEqual(copy, {
    isPrivate: false,
    name: "Arena (copy)",
    notes: source.notes,
    runeIds: [8, 3],
    weaponIds: [6],
    coreIds: [9, 2],
    runePriorities: { 8: "must", 3: "important" },
    weaponPriorities: { 6: "optional" },
    corePriorities: { 9: "important", 2: "must" },
  });
  assert.equal(buildSchema.parse(saveInput(copy)).id, undefined);
  const original = structuredClone(source);
  copy.name = "Different build";
  copy.notes = "Different notes";
  copy.runeIds.reverse();
  copy.weaponIds.push(10);
  copy.coreIds.pop();
  copy.runePriorities[8] = "optional";
  copy.weaponPriorities[6] = "important";
  delete copy.corePriorities[2];
  assert.deepEqual(source, original);
});

test("clone names fit the save limit and builds containing only cores can be cloned", () => {
  const source = {
    ...savedBuild(),
    name: "A".repeat(120),
    runes: [],
    weapons: [],
  };
  const copy = createBuildDraft(source, true);
  assert.equal(copy.name.length, 120);
  assert.ok(copy.name.endsWith(" (copy)"));
  assert.equal(buildSchema.safeParse(saveInput(copy)).success, true);
});

test("editing keeps the original save target and a new draft starts empty", () => {
  const source = savedBuild();
  const edit = createBuildDraft(source);
  assert.equal(edit.id, source.id);
  assert.equal(edit.name, source.name);
  assert.equal(buildSchema.parse(saveInput(edit)).id, source.id);
  const fresh = createBuildDraft();
  assert.equal(Object.hasOwn(fresh, "id"), false);
  assert.equal(fresh.name, "");
  assert.deepEqual(fresh.runeIds, []);
  assert.deepEqual(fresh.weaponIds, []);
  assert.deepEqual(fresh.coreIds, []);
});

const i18n = loadTypeScript("src/lib/i18n/client.tsx");
const { HeroBuilds } = loadTypeScript("src/app/heroes/[slug]/hero-builds.tsx", {
  "@/lib/i18n/client": i18n,
  "./build-actions": {},
  "@/app/heroes/[slug]/build-actions": {},
  "next/navigation": {
    usePathname: () => "/heroes/sea-captain",
    useRouter: () => ({ refresh() {} }),
  },
});

test("saved builds offer a localized Clone button only to editors", () => {
  const render = (canEdit, locale) =>
    renderToStaticMarkup(
      createElement(
        i18n.I18nProvider,
        { locale },
        createElement(HeroBuilds, {
          canEdit,
          heroId: 7,
          heroName: "Sea Captain",
          builds: [{ ...savedBuild(), runes: [], weapons: [], cores: [] }],
          runeAttributes: [],
          weaponAttributes: [],
          cores: [],
        }),
      ),
    );
  assert.match(render(true, "en"), /aria-label="Clone Arena"/);
  assert.match(render(true, "en"), /aria-label="Hide build"/);
  assert.match(render(true, "vi"), /aria-label="Ẩn bản dựng"/);
  assert.doesNotMatch(render(false, "en"), /aria-label="Hide build"/);
  assert.match(render(true, "vi"), /aria-label="Nhân bản Arena"/);
  assert.doesNotMatch(render(false, "en"), /aria-label="Clone Arena"/);
});

test("editing and cloning private builds preserve visibility", () => {
  for (const asCopy of [false, true]) {
    assert.equal(
      createBuildDraft({ ...savedBuild(), isPrivate: true }, asCopy).isPrivate,
      true,
    );
  }
  assert.equal(
    buildSchema.parse({
      ...saveInput(createBuildDraft(savedBuild())),
      isPrivate: true,
    }).isPrivate,
    true,
  );
  assert.equal(
    buildSchema.parse(saveInput(createBuildDraft(savedBuild()))).isPrivate,
    undefined,
  );
});
