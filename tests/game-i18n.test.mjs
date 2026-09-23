import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PgDialect } from "drizzle-orm/pg-core";
import { loadTypeScript } from "./load-typescript.mjs";

const {
  gameLabelKey,
  translateGameLabel,
  matchesGameLabel,
  matchingGameSlugs,
} = loadTypeScript("src/lib/i18n/game-labels.ts");
const en = JSON.parse(
  readFileSync(
    new URL("../src/lib/i18n/game-en.json", import.meta.url),
    "utf8",
  ),
);
const vi = JSON.parse(
  readFileSync(
    new URL("../src/lib/i18n/game-vi.json", import.meta.url),
    "utf8",
  ),
);
const i18n = loadTypeScript("src/lib/i18n/client.tsx");
const render = (Component, props, locale = "vi") =>
  renderToStaticMarkup(
    createElement(
      i18n.I18nProvider,
      { locale },
      createElement(Component, props),
    ),
  );
const hero = {
  id: 1,
  name: "Sea Captain",
  slug: "sea-captain",
  role: "warrior",
  rarity: "mythic",
  imageUrl: "/heroes/sea-captain.png",
  divinities: [],
  hasBuild: true,
};

test("every recorded game name and fishing label has a translation key in both languages", () => {
  const check = (kind, value) => {
    const key = gameLabelKey(kind, value);
    assert.ok(
      key,
      `${kind}: ${typeof value === "string" ? value : value.name}`,
    );
    assert.ok(en[key] && vi[key]?.trim(), key);
    assert.equal(
      translateGameLabel("en", kind, value),
      typeof value === "string" ? value : value.name,
    );
  };
  for (const [kind, file, name] of [
    ["hero", "heroes", "heroSeeds"],
    ["fish", "fishes", "fishSeeds"],
    ["bait", "baits", "baitSeeds"],
    ["divinity", "divinities", "divinitySeeds"],
    ["pet", "pets", "petSeeds"],
    ["relic", "relics", "relicSeeds"],
    ["rune", "rune-attributes", "runeAttributeSeeds"],
    ["weapon", "weapon-attributes", "weaponAttributeSeeds"],
  ]) {
    for (const row of loadTypeScript(`src/data/${file}.ts`)[name]) {
      check(kind, row);
      assert.equal(en[gameLabelKey(kind, row)], row.name);
      if (kind === "fish") {
        check("fishArea", row.area);
        check("fishCollection", row.collection);
        if (row.bait) check("bait", row.bait);
        row.stats.forEach((stat) => check("stat", stat));
      }
    }
  }
  for (const detail of Object.values(
    loadTypeScript("src/data/hero-details.ts").heroDetailSeeds,
  )) {
    for (const skill of [...detail.skills, ...(detail.awakeningSkills ?? [])])
      check("skill", skill);
    detail.cores.forEach((core) => check("core", core));
    if (detail.artifact) {
      check("artifact", detail.artifact);
      for (const bonus of detail.artifact.bonuses)
        if (bonus.name) check("skill", bonus.name);
    }
  }
  assert.deepEqual(Object.keys(en).sort(), Object.keys(vi).sort());
});

test("keys are stable across source label changes and namespaces keep meanings separate", () => {
  assert.equal(gameLabelKey("hero", hero), "hero.sea-captain");
  assert.equal(
    translateGameLabel("vi", "hero", { ...hero, name: "Revised English name" }),
    "Thuyền Trưởng",
  );
  assert.equal(
    translateGameLabel("en", "hero", "hero.sea-captain"),
    "Sea Captain",
  );
  assert.equal(
    translateGameLabel("vi", "hero", "hero.sea-captain"),
    "Thuyền Trưởng",
  );
  assert.equal(
    translateGameLabel("vi", "hero", "Unknown new hero"),
    "Unknown new hero",
  );
  assert.equal(translateGameLabel("vi", "hero", "constructor"), "constructor");
  assert.equal(translateGameLabel("vi", "skill", "Silence"), "Silence");
  assert.equal(translateGameLabel("vi", "hero", "Silence"), "Kẻ Im Lặng");
});

test("hero and fish search accepts both languages, accents, and decomposed Vietnamese", () => {
  for (const query of [
    "Sea Captain",
    "Thuyền Trưởng",
    "thuyen truong",
    "THUYỀN TRƯỞNG",
    "Thuyền Trưởng".normalize("NFD"),
  ]) {
    assert.ok(matchesGameLabel("hero", hero, query), query);
    assert.ok(matchingGameSlugs("hero", query).includes("sea-captain"), query);
  }
  assert.ok(matchesGameLabel("fish", "Electric Eel", "luon dien"));
  assert.ok(matchesGameLabel("fish", "Lemon Fish", "ca chanh"));
  assert.ok(matchesGameLabel("fish", "Lemon Fish", "lemon"));
  assert.equal(matchesGameLabel("fish", "Lemon Fish", "ca map"), false);
  assert.deepEqual(matchingGameSlugs("hero", "%_"), []);
});

test("hero cards translate names and accessibility labels while keeping routes and artwork", () => {
  const { HeroPool } = loadTypeScript("src/app/heroes/hero-pool.tsx", {
    "@/lib/i18n/client": i18n,
  });
  const html = render(HeroPool, { heroes: [hero] });
  assert.match(html, /Thuyền Trưởng/);
  assert.match(html, /href="\/heroes\/sea-captain"/);
  assert.match(html, /alt="Thuyền Trưởng"/);
  assert.match(html, /sea-captain\.png/);
  assert.doesNotMatch(html, /Sea Captain/);
  assert.match(render(HeroPool, { heroes: [hero] }, "en"), /Sea Captain/);
});

test("fish previews translate names, areas and bait", () => {
  const { FishPopover } = loadTypeScript("src/components/fish-popover.tsx", {
    "@/lib/i18n/client": i18n,
    "@/components/info-popover": {
      InfoPopover: ({ trigger, children }) =>
        createElement("div", null, trigger, children),
    },
  });
  const html = render(FishPopover, {
    fish: {
      ...loadTypeScript("src/data/fishes.ts").fishSeeds.find(
        (fish) => fish.slug === "mutated-dragonfish",
      ),
    },
  });
  assert.match(html, /Cá Rồng Đột Biến/);
  assert.match(html, /Bờ Biển Vàng/);
  assert.match(html, /Cá Thòi Lòi/);
  assert.doesNotMatch(html, /Mutated Dragonfish|Gold Coast|Mudskipper/);
});

test("pet and relic labels translate together with their image descriptions", () => {
  const { LineupAssignments } = loadTypeScript(
    "src/components/lineup-assignments.tsx",
    { "@/lib/i18n/client": i18n },
  );
  const html = render(LineupAssignments, {
    pets: [{ id: 1, name: "Magic Owl", iconUrl: "/pets/magic-owl.png" }],
    relics: [
      { id: 2, name: "Spiked Armor", iconUrl: "/relics/spiked-armor.png" },
    ],
  });
  assert.match(html, /Cú Ma Thuật/);
  assert.match(html, /Giáp Gai/);
  assert.doesNotMatch(html, /Magic Owl|Spiked Armor/);
});

test("build-import SQL matches Vietnamese hero names while preserving hero exclusion and pagination", async () => {
  let condition, limit, offset;
  const query = {
    from: () => query,
    innerJoin: () => query,
    where: (value) => {
      condition = value;
      return query;
    },
    orderBy: () => query,
    limit: (value) => {
      limit = value;
      return query;
    },
    offset: (value) => {
      offset = value;
      return [];
    },
  };
  const schema = loadTypeScript("src/db/schema.ts");
  const { getOtherHeroBuilds } = loadTypeScript("src/lib/builds.ts", {
    "@/lib/admin-access": { getAdminId: async () => "owner" },
    "@/lib/viewer-profile": { getViewerKey: async () => "admin:owner" },
    "@/db": { db: { select: () => query }, schema },
  });
  await getOtherHeroBuilds(42, "thuyen truong", 2);
  const sql = new PgDialect().sqlToQuery(condition);
  assert.ok(sql.params.includes("sea-captain"));
  assert.ok(sql.params.includes(42));
  assert.match(sql.sql, /<>/);
  assert.equal(limit, 13);
  assert.equal(offset, 24);
});
