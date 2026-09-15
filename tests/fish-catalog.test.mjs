import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";

const { fishSeeds } = loadTypeScript("src/data/fishes.ts");
const { createI18n } = loadTypeScript("src/lib/i18n/messages.ts");
const { translateGameLabel } = loadTypeScript("src/lib/i18n/game-labels.ts");

test("fish cards show icons, separated stats, area, bait and translated names", () => {
  for (const locale of ["en", "vi"]) {
    const { FishCatalog } = loadTypeScript("src/app/fishes/fish-catalog.tsx", {
      "@/lib/i18n/client": {
        useI18n: () => ({
          ...createI18n(locale),
          gameLabel: (kind, value) => translateGameLabel(locale, kind, value),
        }),
      },
    });
    const fish = fishSeeds.find((item) => item.slug === "mutated-dragonfish");
    const html = renderToStaticMarkup(
      createElement(FishCatalog, { fishes: [{ ...fish, id: 1 }] }),
    );
    for (const label of [
      "Base stats",
      "Special stats",
      "Where to get it",
      "Bait",
    ])
      assert.ok(html.includes(createI18n(locale).t(label)), label);
    for (const [kind, value] of [
      ["fish", fish],
      ["stat", "Reflect DMG"],
      ["fishArea", fish.area],
      ["bait", fish.bait],
    ])
      assert.ok(html.includes(translateGameLabel(locale, kind, value)));
    assert.ok(
      decodeURIComponent(html).includes("/fishes/mutated-dragonfish.png"),
    );
    assert.ok(decodeURIComponent(html).includes("/baits/mudskipper.png"));
    assert.ok(
      html.includes(
        createI18n(locale).t("Rarity: {rarity}", {
          rarity: createI18n(locale).t("Eternal"),
        }),
      ),
    );
    assert.ok(
      !html.includes(
        translateGameLabel(locale, "fishCollection", fish.collection),
      ),
    );
  }
});

test("fishes can be shared as an exact catalog page with only its own artwork", async () => {
  const { publicPagePath } = loadTypeScript("src/lib/public-url-policy.ts");
  const { isPublicPageAsset } = loadTypeScript("src/lib/public-url-assets.ts", {
    "@/db": {},
  });
  assert.equal(publicPagePath("/fishes"), "/fishes");
  assert.equal(publicPagePath("/fishes/new"), null);
  assert.equal(
    await isPublicPageAsset("/fishes", "/fishes/lemon-fish.png"),
    true,
  );
  assert.equal(
    await isPublicPageAsset("/fishes", "/fishes/unknown.png"),
    false,
  );
  assert.equal(
    await isPublicPageAsset("/fishes", "/heroes/sea-captain.png"),
    false,
  );
  assert.equal(
    await isPublicPageAsset("/fishes", "/baits/mudskipper.png"),
    true,
  );
  assert.equal(
    await isPublicPageAsset("/fishes", "/baits/lucky-star.png"),
    false,
  );
});

test("fish catalog sorts special stats first, then names, and explicitly shows None for missing bait", () => {
  const { FishCatalog } = loadTypeScript("src/app/fishes/fish-catalog.tsx", {
    "@/lib/i18n/client": {
      useI18n: () => ({
        ...createI18n("en"),
        gameLabel: (_kind, value) =>
          typeof value === "string" ? value : value.name,
      }),
    },
  });
  const fishes = [
    "lemon-fish",
    "mutated-dragonfish",
    "giant-squid",
    "frog",
  ].map((slug, id) => ({
    ...fishSeeds.find((fish) => fish.slug === slug),
    id,
  }));
  const html = renderToStaticMarkup(createElement(FishCatalog, { fishes }));
  const names = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(names, [
    "Giant Squid",
    "Mutated Dragonfish",
    "Frog",
    "Lemon Fish",
  ]);
  assert.equal([...html.matchAll(/>None<\/span>/g)].length, 2);
  assert.ok(!html.includes("Collection"));
});
