import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { heroSeeds } from "../src/data/heroes.ts";
import {
  UNRELEASED_HERO_SLUGS,
  getHeroReleaseStatus,
} from "../src/data/hero-release-status.ts";
import { loadTypeScript } from "./load-typescript.mjs";

test("the owner's four unreleased heroes have roster entries and portrait assets", () => {
  const names = heroSeeds
    .filter((hero) => getHeroReleaseStatus(hero.slug) === "unreleased")
    .map((hero) => hero.name)
    .sort();
  assert.deepEqual(names, [
    "Dreamstar Spirit",
    "Nether Soul",
    "Nightmare Source",
    "Panda Warrior",
  ]);
  for (const slug of UNRELEASED_HERO_SLUGS) {
    const hero = heroSeeds.find((candidate) => candidate.slug === slug);
    assert.ok(hero.imageUrl);
    const bytes = readFileSync(
      new URL(`../public${hero.imageUrl}`, import.meta.url),
    );
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  }
  assert.equal(getHeroReleaseStatus("sea-captain"), "released");
});

test("the catalog renders accessible release tabs and defaults to released heroes", () => {
  const i18n = loadTypeScript("src/lib/i18n/client.tsx");
  const { HeroPool } = loadTypeScript("src/app/heroes/hero-pool.tsx", {
    "@/lib/i18n/client": i18n,
  });
  const heroes = heroSeeds.map((hero, index) => ({
    ...hero,
    id: index + 1,
    divinities: [],
    hasBuild: false,
    notes: null,
    artifactName: null,
    artifactIconUrl: null,
    detailSeedHash: null,
    createdAt: new Date(0),
  }));
  const render = (locale) =>
    renderToStaticMarkup(
      createElement(
        i18n.I18nProvider,
        { locale },
        createElement(HeroPool, { heroes }),
      ),
    );
  const html = render("en");
  assert.match(html, /role="tablist"/);
  assert.match(
    html,
    /role="tab"[^>]*aria-selected="true"[^>]*>Released<\/button>/,
  );
  assert.match(
    html,
    /role="tab"[^>]*aria-selected="false"[^>]*>Unreleased<\/button>/,
  );
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /href="\/heroes\/sea-captain"/);
  for (const slug of UNRELEASED_HERO_SLUGS) {
    assert.ok(
      !html.includes(`href="/heroes/${slug}"`),
      `${slug} must stay out of Released`,
    );
  }
  const vi = render("vi");
  assert.match(vi, /Đã ra mắt/);
  assert.match(vi, /Chưa ra mắt/);
});
