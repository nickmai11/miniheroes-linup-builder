import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";

const { relics, relicBySlug, mythicGroups, chestRecipes, legendChestRecipes } =
  loadTypeScript("src/data/relic-fusion.ts");

test("36 relics with icons; recipes follow the archive's tier ladder", () => {
  assert.equal(relics.length, 36);
  assert.equal(relicBySlug.size, 36);
  for (const r of relics)
    assert.ok(existsSync(`public/relics/${r.slug}.png`), r.slug);
  assert.ok(existsSync("public/relics/mythic-chest.png"));
  const below = { common: "base", rare: "common", legend: "rare" };
  for (const r of relics) {
    assert.equal(!!r.recipe, r.tier in below, r.slug);
    if (!r.recipe) continue;
    const total = r.recipe.reduce((sum, part) => sum + part.count, 0);
    assert.equal(total, r.tier === "common" ? 6 : 3, r.slug);
    for (const part of r.recipe)
      assert.equal(
        relicBySlug.get(part.slug)?.tier,
        below[r.tier],
        `${r.slug}: ${part.slug}`,
      );
  }
  assert.deepEqual(relicBySlug.get("stone-hammer").recipe, [
    { slug: "bronze-mirror", count: 2 },
    { slug: "limestone", count: 4 },
  ]);
});

test("Legend chest: two formulas of 3 different Rares, all 6 Rares used once", () => {
  assert.ok(existsSync("public/relics/legend-chest.png"));
  assert.equal(legendChestRecipes.length, 2);
  const slugs = legendChestRecipes.flat().map((p) => p.slug);
  assert.equal(new Set(slugs).size, 6);
  slugs.forEach((s) => assert.equal(relicBySlug.get(s).tier, "rare", s));
});

test("two Mythic groups of four, each with four chest formulas from its own Legends", () => {
  assert.equal(mythicGroups.length, 2);
  const seen = new Set();
  for (const group of mythicGroups) {
    group.mythics.forEach((s) =>
      assert.equal(relicBySlug.get(s).tier, "mythic", s),
    );
    group.legends.forEach((s) =>
      assert.equal(relicBySlug.get(s).tier, "legend", s),
    );
    [...group.mythics, ...group.legends].forEach((s) => seen.add(s));
    const recipes = chestRecipes(group.legends);
    assert.equal(recipes.length, 4);
    for (const recipe of recipes) {
      assert.equal(new Set(recipe.map((p) => p.slug)).size, 3);
      recipe.forEach((p) => assert.ok(group.legends.includes(p.slug)));
    }
  }
  assert.equal(seen.size, 16);
  assert.deepEqual(
    chestRecipes(mythicGroups[0].legends)[0].map((p) => p.slug),
    ["broadsword", "dragon-seal", "memorial-stele"],
  );
});

test("the page shows both groups as icons, names only as labels, in both languages", () => {
  const client = loadTypeScript("src/lib/i18n/client.tsx");
  const { RelicGroups } = loadTypeScript("src/app/relics/relic-groups.tsx", {
    "@/lib/i18n/client": client,
  });
  const render = (locale) =>
    renderToStaticMarkup(
      createElement(
        client.I18nProvider,
        { locale },
        createElement(RelicGroups),
      ),
    );
  const en = render("en");
  assert.match(en, /Mythic group 1/);
  assert.match(en, /role="tab"[^>]*>Mythic group 1</);
  assert.match(en, /role="tab"[^>]*>Mythic group 2</);
  assert.match(en, /aria-label="Night Twinblades"/);
  assert.match(en, /aria-label="Mythic chest"/);
  assert.match(en, /aria-label="Legend chest"/); // first of the group's Legend formulas
  assert.match(en, /aria-label="Limestone ×16"/);
  assert.doesNotMatch(en.replace(/<[^>]+>/g, " "), /Night Twinblades/);
  assert.doesNotMatch(en, /calculator|base relics/i);
  assert.doesNotMatch(en, /type="checkbox"/);
  assert.match(en, /role="tab"[^>]*>Common</);
  assert.doesNotMatch(en, /Rare formulas/); // the Common tab isn't open by default
  const vi = render("vi");
  assert.match(vi, /Nhóm Thần thoại 2/);
  assert.match(vi, /aria-label="Song Đao Bóng Đêm"/);
});

test("every formula expands tier by tier down to base relics", () => {
  const { expandToBase } = loadTypeScript("src/data/relic-fusion.ts");
  const rows = expandToBase(relicBySlug.get("broadsword").recipe).map((row) =>
    Object.fromEntries(row.map((p) => [p.slug, p.count])),
  );
  assert.deepEqual(rows, [
    { "puppet-doll": 1, "beast-totem": 1, "tribal-goblet": 1 },
    { "stone-hammer": 2, "bone-saw": 4, "bronze-dagger": 3 },
    { "bronze-mirror": 16, "beast-bone": 22, limestone: 16 },
  ]);
  const chest = expandToBase(chestRecipes(mythicGroups[0].legends)[0]);
  assert.equal(chest.length, 4);
  assert.equal(
    chest.at(-1).reduce((sum, p) => sum + p.count, 0),
    162,
  );
  assert.deepEqual(
    expandToBase(relicBySlug.get("stone-hammer").recipe).length,
    1,
  );
});
