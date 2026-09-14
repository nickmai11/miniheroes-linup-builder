import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";

const i18n = loadTypeScript("src/lib/i18n/client.tsx");
const { HeroPortrait } = loadTypeScript("src/components/hero-portrait.tsx", {
  "@/lib/i18n/client": i18n,
});
const hero = {
  name: "Sea Captain",
  role: "warrior",
  rarity: "mythic",
  imageUrl: "/heroes/sea-captain.png",
};

function portrait(props, locale = "en") {
  return renderToStaticMarkup(
    createElement(
      i18n.I18nProvider,
      { locale },
      createElement(HeroPortrait, props),
    ),
  );
}

test("Vietnamese build indicators preserve the recorded hero name and artwork", () => {
  const html = portrait({ hero: { ...hero, hasBuild: true } }, "vi");
  assert.match(html, /aria-label="Có cách xây dựng cho Sea Captain"/);
  assert.match(html, /alt="Sea Captain"/);
  assert.match(html, /heroes(?:\/|%2F)sea-captain\.png/);
});

test("a saved build adds an accessible portrait indicator without replacing the art or divinities", () => {
  const html = portrait({
    hero: { ...hero, hasBuild: true },
    divinities: [
      {
        name: "Physical DMG Boost",
        iconUrl: "/divinities/physical-dmg-boost.png",
      },
      { name: "CRIT Damage", iconUrl: "/divinities/crit-damage.png" },
    ],
  });
  assert.match(html, /aria-label="Build available for Sea Captain"/);
  assert.match(html, /data-slot="tooltip-trigger"/);
  assert.match(html, /title=""/);
  assert.doesNotMatch(html, /title="Sea Captain has a saved build"/);
  assert.doesNotMatch(html, /<button/);
  assert.match(html, /alt="Sea Captain"/);
  assert.match(html, /alt="Physical DMG Boost"/);
  assert.match(html, /alt="CRIT Damage"/);
  assert.equal((html.match(/role="img"/g) ?? []).length, 1);
});

test("portraits without saved builds have no build indicator", () => {
  for (const hasBuild of [false, undefined]) {
    const html = portrait({ hero: { ...hero, hasBuild } });
    assert.doesNotMatch(html, /Build available|has a saved build/);
  }
});

test("the detail page's loaded build state can add and remove the badge", () => {
  assert.match(portrait({ hero, hasBuild: true }), /Build available/);
  assert.doesNotMatch(
    portrait({ hero: { ...hero, hasBuild: true }, hasBuild: false }),
    /Build available/,
  );
});

test("build availability does not depend on a portrait image or lineup assignment", () => {
  const html = portrait({ hero: { ...hero, imageUrl: null, hasBuild: true } });
  assert.match(html, /Build available for Sea Captain/);
  assert.match(html, />SC</);
});

test("an empty portrait list does not query build data", async () => {
  const { getHeroIdsWithBuilds } = loadTypeScript("src/lib/builds.ts", {
    "@/db": {
      db: new Proxy(
        {},
        {
          get() {
            assert.fail("Unexpected database query");
          },
        },
      ),
    },
  });
  assert.deepEqual(await getHeroIdsWithBuilds([]), new Set());
});
