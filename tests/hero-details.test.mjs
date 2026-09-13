import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  HERO_AWAKENING_STAGES,
  heroDetailSeeds,
} from "../src/data/hero-details.ts";
import { heroSeeds } from "../src/data/heroes.ts";
import { divinitySeeds } from "../src/data/divinities.ts";

const roster = new Set(heroSeeds.map((hero) => hero.slug));
const divinities = new Set(divinitySeeds.map((divinity) => divinity.slug));
const awakeningStages = new Set(
  HERO_AWAKENING_STAGES.map(({ stage }) => stage),
);

function assertPng(path) {
  assert.match(path, /^\/(talents|artifacts)\/[a-z0-9/-]+\.png$/);
  const bytes = readFileSync(new URL(`../public${path}`, import.meta.url));
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
}

for (const [slug, hero] of Object.entries(heroDetailSeeds)) {
  test(`${slug}: talent order, links, catalog entries, and image assets are valid`, () => {
    assert.ok(roster.has(slug), "detail seed must belong to an existing hero");
    assert.deepEqual(
      hero.skills.map(({ unlockStars }) => unlockStars),
      [0, 2, 5, 8, 12, 16],
    );
    assert.equal(hero.skills[0].kind, "ultimate");
    const talents = new Set(hero.skills.map(({ name }) => name));
    assert.equal(talents.size, hero.skills.length);
    for (const skill of hero.skills) assertPng(skill.iconUrl);

    assert.equal(
      new Set(hero.cores.map(({ name }) => name)).size,
      hero.cores.length,
    );
    for (const core of hero.cores) assert.ok(talents.has(core.skill));
    if (hero.artifact) {
      assertPng(hero.artifact.iconUrl);
      const tiers = hero.artifact.bonuses.map(({ tier }) => tier);
      assert.equal(new Set(tiers).size, tiers.length);
      for (const bonus of hero.artifact.bonuses) {
        if (bonus.skill) assert.ok(talents.has(bonus.skill));
        else assert.ok(bonus.name, "standalone artifact skills need a name");
      }
    }

    assert.equal(hero.divinities.length, 2);
    for (const divinity of hero.divinities) assert.ok(divinities.has(divinity));
  });

  test(`${slug}: recorded awakenings are unique hero-specific stages with sources`, () => {
    const awakenings = hero.awakeningSkills ?? [];
    assert.equal(
      new Set(awakenings.map(({ stage }) => stage)).size,
      awakenings.length,
    );
    for (const skill of awakenings) {
      assert.ok(
        awakeningStages.has(skill.stage),
        "class-wide II/IV must stay separate",
      );
      assert.ok(skill.name && skill.description && skill.sourceScreenshot);
      assert.equal("iconUrl" in skill, false, "awakening skills are text-only");
    }
  });
}
