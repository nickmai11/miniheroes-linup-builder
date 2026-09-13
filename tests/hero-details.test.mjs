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

const septemberBatch = [
  "jungle-envoy",
  "radiant-paladin",
  "silence",
  "gunslinger",
  "dark-knight",
  "arcane-saint",
  "witch-dictator",
  "silver-warrior",
  "holy-healer",
];

test("the nine-hero screenshot batch has complete cores, artifact tiers and awakenings", () => {
  assert.deepEqual(HERO_AWAKENING_STAGES, [
    { stage: "I", unlockStars: 18 },
    { stage: "III", unlockStars: 22 },
  ]);
  for (const slug of septemberBatch) {
    const hero = heroDetailSeeds[slug];
    assert.ok(hero, `${slug}: recorded details`);
    assert.equal(hero.skills.length, 6, slug);
    assert.equal(hero.cores.length, 4, slug);
    assert.deepEqual(
      hero.artifact.bonuses.map(({ tier }) => tier),
      ["purple", "gold", "red", "rainbow"],
      slug,
    );
    assert.deepEqual(
      hero.awakeningSkills.map(({ stage }) => stage),
      ["I", "III"],
      slug,
    );
    for (const awakening of hero.awakeningSkills) {
      const bytes = readFileSync(
        new URL(
          `../gameplay/talents/${awakening.sourceScreenshot}`,
          import.meta.url,
        ),
      );
      assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    }
  }
});

test("artifact attachment follows talent links, not quality", () => {
  for (const [slug, tier, name] of [
    ["dark-knight", "gold", "Frost Dark Axe"],
    ["gunslinger", "gold", "Full-out Shooting"],
    ["witch-dictator", "red", "Withering Fear"],
  ]) {
    const bonus = heroDetailSeeds[slug].artifact.bonuses.find(
      (b) => b.tier === tier,
    );
    assert.equal(bonus.name, name);
    assert.equal(bonus.skill, undefined);
  }
  for (const [slug, talent] of [
    ["gunslinger", "Snipe"],
    ["witch-dictator", "Frost Echo"],
  ]) {
    const bonus = heroDetailSeeds[slug].artifact.bonuses.find(
      (b) => b.tier === "rainbow",
    );
    assert.equal(bonus.skill, talent);
    assert.equal(bonus.name, undefined);
  }
});

test("the Jungle Envoy and Witch Dictator follow-ups complete their missing details", () => {
  const jungle = heroDetailSeeds["jungle-envoy"];
  assert.match(jungle.skills[0].description, /38%.*7s/);
  const wand = jungle.cores.find((core) => core.name === "Wizard's Wand");
  assert.equal(wand.skill, "Pulse Nova");
  assert.match(wand.description, /30%.*Heavy Injury Effect/);

  const darkFaded = heroDetailSeeds["witch-dictator"].awakeningSkills[0];
  assert.equal(darkFaded.name, "Dark Faded");
  assert.match(darkFaded.description, /30% chance to freeze enemies for 1\.5s/);
  assert.match(darkFaded.description, /energy by 30 \(CD: 3 s\)/);
  assert.match(darkFaded.sourceScreenshot, /11\.51\.47/);
});

test("unusual talent kinds and aliases remain faithful to the screenshot titles", () => {
  assert.equal(heroDetailSeeds["holy-healer"].skills[1].kind, "enhance");
  assert.equal(heroDetailSeeds["radiant-paladin"].skills[3].kind, "passive");
  assert.equal(heroDetailSeeds.silence.skills[1].kind, "special");
  assert.equal(heroDetailSeeds.gunslinger.skills[1].kind, "special");
  assert.match(heroDetailSeeds.silence.skills[0].description, /for 4 and/);
  const boots = heroDetailSeeds["silver-warrior"].cores.find(
    (core) => core.name === "Brawler's Boots",
  );
  assert.equal(boots.skill, "Annihilation Blade");
  assert.match(boots.description, /Blade of Destruction/);
});
