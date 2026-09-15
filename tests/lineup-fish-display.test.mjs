import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";

const { fishSeeds } = loadTypeScript("src/data/fishes.ts");
const { createI18n } = loadTypeScript("src/lib/i18n/messages.ts");
const { translateGameLabel } = loadTypeScript("src/lib/i18n/game-labels.ts");
const dragonfish = {
  ...fishSeeds.find((fish) => fish.slug === "mutated-dragonfish"),
  id: 1,
  quantity: 3,
};
const goldfish = {
  ...fishSeeds.find((fish) => fish.slug === "little-goldfish"),
  id: 2,
  quantity: 1,
};

function load(path, locale = "en") {
  return loadTypeScript(path, {
    "@/lib/i18n/client": {
      useI18n: () => ({
        ...createI18n(locale),
        gameLabel: (kind, value) => translateGameLabel(locale, kind, value),
      }),
    },
    // Expose portal content to server-rendering assertions. Hover/touch behavior
    // remains supplied by the existing shared InfoPopover component.
    "@/components/info-popover": {
      InfoPopover: ({ trigger, children, label }) =>
        createElement("section", { "aria-label": label }, trigger, children),
    },
  });
}

test("fish previews expose localized stats, category, location and bait without collection info", () => {
  for (const locale of ["en", "vi"]) {
    const { FishPopover } = load("src/components/fish-popover.tsx", locale);
    const html = decodeURIComponent(
      renderToStaticMarkup(createElement(FishPopover, { fish: dragonfish })),
    );
    for (const label of [
      "Base stats",
      "Special stats",
      "Where to get it",
      "Bait",
      "Large",
    ])
      assert.ok(html.includes(createI18n(locale).t(label)), label);
    for (const [kind, value] of [
      ["fish", dragonfish],
      ["stat", "Support HP"],
      ["stat", "Reflect DMG"],
      ["fishArea", "Gold Coast"],
      ["bait", "Mudskipper"],
    ])
      assert.ok(html.includes(translateGameLabel(locale, kind, value)), value);
    assert.ok(html.includes("/fishes/mutated-dragonfish.png"));
    assert.ok(html.includes("/baits/mudskipper.png"));
    assert.ok(
      html.includes(
        createI18n(locale).t("Rarity: {rarity}", {
          rarity: createI18n(locale).t("Eternal"),
        }),
      ),
    );
    assert.ok(
      !html.includes(
        translateGameLabel(locale, "fishCollection", dragonfish.collection),
      ),
    );
  }
});

test("fish previews preserve explicit empty stats and bait, with an icon fallback", () => {
  const { FishPopover } = load("src/components/fish-popover.tsx");
  const html = renderToStaticMarkup(
    createElement(FishPopover, { fish: { ...goldfish, iconUrl: null } }),
  );
  assert.match(html, /None recorded/);
  assert.match(html, />None<\/span>/);
  assert.match(html, /Mage HP/);
  assert.ok(!html.includes("/fishes/"));
});

test("saved lineup fishes show screenshot icons, quantities and full previews", () => {
  const { LineupFishes } = load("src/components/lineup-fishes.tsx");
  const html = decodeURIComponent(
    renderToStaticMarkup(
      createElement(LineupFishes, { fishes: [dragonfish, goldfish] }),
    ),
  );
  assert.match(html, /×3/);
  assert.match(html, /×1/);
  assert.ok(html.includes("/fishes/mutated-dragonfish.png"));
  assert.ok(html.includes("/fishes/little-goldfish.png"));
  assert.match(html, /Reflect DMG/);
  assert.match(html, /Mage HP/);
});

test("builder keeps selected fish icons and preview buttons visible when dropdowns are closed", () => {
  const { FishPicker } = load("src/app/lineups/new/fish-picker.tsx");
  const html = decodeURIComponent(
    renderToStaticMarkup(
      createElement(FishPicker, {
        fishes: [dragonfish, goldfish],
        selections: [{ fishId: 1, quantity: 3 }],
        onChange: () => {
          throw new Error("Rendering must not modify selections");
        },
        disabled: false,
      }),
    ),
  );
  assert.ok(html.includes("/fishes/mutated-dragonfish.png"));
  assert.match(html, /×3/);
  assert.match(html, /Reflect DMG/);
  assert.ok(!html.includes("/fishes/little-goldfish.png"));
  assert.match(html, /Select Large fishes/);
});
