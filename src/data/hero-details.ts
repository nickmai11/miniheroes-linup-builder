import type { ArtifactTier, SkillKind } from "@/db/schema";

/** Star unlock thresholds confirmed by the owner on 2026-09-13. */
export const HERO_AWAKENING_STAGES = [
  { stage: "I", unlockStars: 18 },
  { stage: "III", unlockStars: 22 },
] as const;

/** Hero-specific awakenings. Class-wide II/IV belong in shared class data. */
export type HeroAwakeningSkill = {
  stage: (typeof HERO_AWAKENING_STAGES)[number]["stage"];
  name: string;
  description: string;
  /** Owner screenshot filename under gameplay/talents/. */
  sourceScreenshot: string;
};

/**
 * Per-hero details transcribed from the owner's in-game screenshots
 * (gameplay/talents/, gameplay/divinities/). Talents, artifacts, cores and divinities
 * sync into the DB on view (syncHeroDetail in src/lib/heroes.ts); awakening skills
 * are read directly from this file. Icons come from scripts/slice-talent-icons.py.
 */
export type HeroDetailSeed = {
  /** The divine weapon from the Artifact tab. */
  artifact?: {
    name: string;
    iconUrl?: string;
    /**
     * One ability per quality tier in unlock order. Talent bonuses name the
     * talent they modify (`skill`); standalone abilities carry their `name`.
     * Any quality may be standalone or linked; never infer attachment by tier.
     */
    bonuses: {
      tier: ArtifactTier;
      skill?: string;
      name?: string;
      description: string;
    }[];
  };
  /**
   * Talents in unlock order: the ultimate (available from the start), then the
   * ring clockwise from the lower-left at 2★, 5★, 8★, 12★, 16★.
   */
  skills: {
    kind: SkillKind;
    name: string;
    description: string;
    unlockStars: number;
    /** Path under /public: /talents/<hero>/<skill-slug>.png. */
    iconUrl?: string;
  }[];
  /** `<Gear>·Core` bonuses; `skill` names the talent they modify. */
  cores: { name: string; skill: string; description: string }[];
  /** Mythic (red) divinity slugs: [bottom-left, bottom-right]. */
  divinities: string[];
  /** Read directly by the server; this fixed content needs no per-view DB sync. */
  awakeningSkills?: HeroAwakeningSkill[];
};

const talent = (hero: string, slug: string) => `/talents/${hero}/${slug}.png`;

export const heroDetailSeeds: Record<string, HeroDetailSeed> = {
  // September 14 12.58.22–12.58.40 PM owner screenshots; I/III not supplied.
  swordmaster: {
    artifact: {
      name: "Devil Fruit",
      iconUrl: "/artifacts/swordmaster.png",
      bonuses: [
        {
          tier: "purple",
          skill: "36 Pound Cannon",
          description:
            "After the silence from [36 Pound Cannon] ends, reduces the target's energy recovery speed by 40% for 5s",
        },
        {
          tier: "gold",
          skill: "Rashomon",
          description:
            "The reflect DMG effect of [Rashomon] is increased by 30%, and its duration is extended by 2s",
        },
        {
          tier: "red",
          name: "Great Chiliocosm",
          description:
            "After entering the battlefield for 13s, the Swordmaster unleashes a sword aura storm around himself with dual blades, making it impossible for opponents to evade. Targets take 27% increased DMG from him, and his own silence duration is reduced by 60% until the end of battle",
        },
        {
          tier: "rainbow",
          skill: "Rashomon",
          description:
            "When the Swordmaster activates [Rashomon], immediately restores 13% of his max HP. While the sword aura barrier is active, his energy recovery speed is increased by 35% and his HP regeneration per second is increased by 0.8%",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Infernal Oni Slash",
        unlockStars: 0,
        iconUrl: talent("swordmaster", "infernal-oni-slash"),
        description:
          "The Swordmaster creates phantoms to dash and strike across the battlefield, unleashing 6 slashes. Each slash deals 360% ATK as physical DMG and knocks enemies back. Each target can be hit up to 3 times. Units vulnerable to physical DMG are prioritized",
      },
      {
        kind: "battle",
        name: "36 Pound Cannon",
        unlockStars: 2,
        iconUrl: talent("swordmaster", "36-pound-cannon"),
        description:
          "Every 10s, unleashes a sword aura that targets the enemy unit with the highest energy, dealing 500% ATK as physical DMG and silencing them for 1.5s",
      },
      {
        kind: "enhance",
        name: "Enhanced Slash",
        unlockStars: 5,
        iconUrl: talent("swordmaster", "enhanced-slash"),
        description:
          "When the target struck by Infernal Oni Slash has higher ATK than self, reduces their ATK by 15% for 7s (effect cannot stack, reapplying refreshes the duration)",
      },
      {
        kind: "special",
        name: "Rashomon",
        unlockStars: 8,
        iconUrl: talent("swordmaster", "rashomon"),
        description:
          "Each time the Swordmaster loses 25% of max HP, he forms a Sword Aura barrier with Iaido, providing both defense and counterattack. The barrier blocks 18% DMG and increases his reflect DMG by 25% for 4s (effect cannot stack; reapplying refreshes duration).",
      },
      {
        kind: "passive",
        name: "Armament Haki",
        unlockStars: 12,
        iconUrl: talent("swordmaster", "armament-haki"),
        description: "ATK increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Path of Asura",
        unlockStars: 16,
        iconUrl: talent("swordmaster", "path-of-asura"),
        description:
          "Infernal Oni Slash: Each slash sears the target, dealing additional True Damage equal to 100% of Attack and lowering the target's Knockback Resist by 15% for 5 seconds.",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Infernal Oni Slash",
        description:
          "「Infernal Oni Slash」 deals Physical DMG equal to 60%(180%) of Attack",
      },
      {
        name: "Cavalier Helm",
        skill: "Enhanced Slash",
        description:
          "「Enhance Slash」 each slash inflicts bonus DMG equal to 1.5%(4.5%) of the Target's lost HP, capped at 150%(450%) of the Swordmaster's Attack",
      },
      {
        name: "Brawler's Armor",
        skill: "Rashomon",
        description:
          "「Rashomon」 enhances Reflect DMG by an additional 10%(30%)",
      },
      {
        name: "Brawler's Boots",
        skill: "Path of Asura",
        description:
          "「Path of Asura」 inflicts True DMG equal to 20%(60%) of Attack, and extends its duration by 1(3) s",
      },
    ],
    divinities: ["atk", "melee-dmg-boost"],
  },
  // September 14 10.40–10.45 AM screenshots and 10.57–10.58 AM follow-ups.
  // Full source mapping and exact transcription notes are in the game reference.
  "wine-immortal": {
    artifact: {
      name: "Dragon's Secret",
      iconUrl: "/artifacts/wine-immortal.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Ground-Shaking Hit",
          description:
            'Increase the chance of triggering "Ground-Shaking Hit" by 5%, and increase Knockback Effect by 100%.',
        },
        {
          tier: "gold",
          skill: "Wine Mist Flame",
          description:
            '"Mist Flames" Enemies hit by flames have their healing effect reduced by 50%',
        },
        {
          tier: "red",
          skill: "Storm Warrior",
          description:
            '"Storm Warrior" During the effect, Knockback Resist is increased by 100%, and the effect gradually weakens over time',
        },
        {
          tier: "rainbow",
          skill: "Storm Warrior",
          description:
            '"Storm Warrior" Extends its duration by 10, but will be unable to recover Energy during this period.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Storm Warrior",
        description:
          "Clears the debuffs of self, and transforms into a powerful Storm Warrior. Increases the DMG Reduction by 30% and deals Physical DMG equal to 50% of ATK to surrounding targets per second, lasting for 6s",
        unlockStars: 0,
        iconUrl: "/talents/wine-immortal/storm-warrior.png",
      },
      {
        kind: "battle",
        name: "Ground-Shaking Hit",
        description:
          "Basic ATK have a 25% chance to hit the ground, dealing Physical DMG equal to 150% of ATK to surrounding targets and decreases MOV SPD by 30% for 3s",
        unlockStars: 2,
        iconUrl: "/talents/wine-immortal/ground-shaking-hit.png",
      },
      {
        kind: "enhance",
        name: "Swift Steps",
        description:
          "Storm Warrior During the transformation, MOV SPD is increased by 20%",
        unlockStars: 5,
        iconUrl: "/talents/wine-immortal/swift-steps.png",
      },
      {
        kind: "special",
        name: "Wine Mist Flame",
        description:
          "At regular intervals, exhale a bust of flames forward and deal Physical DMG equal to 100% of ATK per second to targets within the range, lasting for 5s",
        unlockStars: 8,
        iconUrl: "/talents/wine-immortal/wine-mist-flame.png",
      },
      {
        kind: "attribute",
        name: "Drunken Dance",
        description: "EVA increased by 10%, HP increased by 15%",
        unlockStars: 12,
        iconUrl: "/talents/wine-immortal/drunken-dance.png",
      },
      {
        kind: "enhance",
        name: "Earth Element",
        description:
          "Storm Warrior During the transformation, Anti-Control Rate is increased by 75%. Receive healing 1% of maximum health per second",
        unlockStars: 16,
        iconUrl: "/talents/wine-immortal/earth-element.png",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Storm Warrior",
        description:
          "「Storm Warrior」 increases DMG Reduction by 6%(18%) and deals Physical DMG equal to 20%(60%) of Attack each second",
      },
      {
        name: "Cavalier Helm",
        skill: "Ground-Shaking Hit",
        description:
          "「Ground-Shaking Hit」 deals 150%(450%) of Attack as bonus Physical DMG",
      },
      {
        name: "Brawler's Armor",
        skill: "Wine Mist Flame",
        description: "「Wine Mist Flame」 increases its DMG duration by 1(3) s",
      },
      {
        name: "Brawler's Boots",
        skill: "Earth Element",
        description:
          "「Earth Element」 additionally restores 0.5%(1.5%) of Max HP per second",
      },
    ],
    divinities: ["spd-reduction-res", "control-res"],
  },
  "abyssal-queen": {
    artifact: {
      name: "Sickle of Fear",
      iconUrl: "/artifacts/abyssal-queen.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Poisoned Blade",
          description:
            '"Poisoned Blade" Penetrate enemies, dealing equal damage and effects to 2 enemy unit(s) in the front.',
        },
        {
          tier: "gold",
          skill: "Abyss Roar",
          description:
            '"Abyss Roar" Deals an additional True DMG equal to 100% of ATK to enemies',
        },
        {
          tier: "red",
          skill: "Abyss Roar",
          description:
            '"Abyss Roar" DMG range increased by 30%, and the Magic DMG dealt is increased by 65%',
        },
        {
          tier: "rainbow",
          skill: "Queen's Shriek",
          description: '"Queen\'s Shriek" Now activates every 13s.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Abyss Roar",
        description:
          "The Abyssal Queen emits a super sonic wave, dealing Magic ATK 220% to targets in the front area, with Interrupt and Knockback effects",
        unlockStars: 0,
        iconUrl: "/talents/abyssal-queen/abyss-roar.png",
      },
      {
        kind: "battle",
        name: "Poisoned Blade",
        description:
          "Basic ATK have a 30% chance to shoot a poisoned dagger, dealing Magic ATK 200% to the target and reducing the target's 20% Knockback Resist for 3s.",
        unlockStars: 2,
        iconUrl: "/talents/abyssal-queen/poisoned-blade.png",
      },
      {
        kind: "enhance",
        name: "Sonic Enhance",
        description: "Abyss Roar Increases Knockback Effect by 30%",
        unlockStars: 5,
        iconUrl: "/talents/abyssal-queen/sonic-enhance.png",
      },
      {
        kind: "special",
        name: "Queen's Shriek",
        description:
          "At the 20-second mark in battle, the Abyssal Queen will scream, causing all enemy targets to lose 18% of their current HP, with a 2 second stun (can only be triggered 1 time(s) per battle, cannot exceed 350% of the Abyssal Queen’s ATK).",
        unlockStars: 8,
        iconUrl: "/talents/abyssal-queen/queen-s-shriek.png",
      },
      {
        kind: "attribute",
        name: "ATK Amplification",
        description: "Increases ATK by 25%",
        unlockStars: 12,
        iconUrl: "/talents/abyssal-queen/atk-amplification.png",
      },
      {
        kind: "enhance",
        name: "Super Sonic Wave",
        description:
          "Abyss Roar Increases the Magic DMG dealt by 65%, decreases the DMG Result of hit targets by 25% within 5s",
        unlockStars: 16,
        iconUrl: "/talents/abyssal-queen/super-sonic-wave.png",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Abyss Roar",
        description:
          "「Abyss Roar」 inflicts additional Magic DMG equal to 25%(75%) of ATK",
      },
      {
        name: "Arcane Hat",
        skill: "Poisoned Blade",
        description: "「Poisoned Blade」 Trigger Chance increased by 8%(24%)",
      },
      {
        name: "Mage Robe",
        skill: "Queen's Shriek",
        description:
          "「Queen's Shriek」 now also drains 2%(6%) of the target's Current HP (up to 400%(500%) of the Abyssal Queen's ATK)",
      },
      {
        name: "Spell Tome",
        skill: "Super Sonic Wave",
        description:
          "「Super Sonic Wave」 DMG Result Reduction enhanced by 3%(9%)",
      },
    ],
    divinities: ["hp", "dmg-reduction"],
  },
  "iron-fan-princess": {
    artifact: {
      name: "Palm-Leaf Fan",
      iconUrl: "/artifacts/iron-fan-princess.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Palm-Leaf Fan·Power",
          description:
            '"Palm-Leaf Fan·Power" Tornado deals additional DMG equal to 6% of the enemy\'s maximum HP (up to 250% of Iron Fan Princess attack)',
        },
        {
          tier: "gold",
          skill: "Palm-Leaf Fan·Fire",
          description:
            '"Palm-Leaf Fan·Fire" converts DMG dealt to enemies into True DMG. The targets hit will have their healing effects reduced by 35%. The effect lasts for 5s',
        },
        {
          tier: "red",
          skill: "Palm-Leaf Fan·Wind",
          description:
            '"Palm-Leaf Fan·Wind" increases ATK SPD by 100% after casting. The effect lasts for 5s',
        },
        {
          tier: "rainbow",
          name: "Wind Mastery",
          description:
            "Upon entering combat, nearby allied units gain 20% ATK SPD and 20% Knockback Resist",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Palm-Leaf Fan·Wind",
        description:
          "Instantly remove all debuffs and swing the fan to release a hurricane forward. The hurricane moves slowly and continuously knocks back enemies. The hurricane can deal up to 4 segments of 45% Magic DMG to enemies",
        unlockStars: 0,
        iconUrl: "/talents/iron-fan-princess/palm-leaf-fan-wind.png",
      },
      {
        kind: "battle",
        name: "Palm-Leaf Fan·Power",
        description:
          "Basic ATK has a 30% chance to swing the fan and release a powerful whirlwind. The whirlwind deals Magic DMG equal to 250% of ATK and significantly knocks enemies back",
        unlockStars: 2,
        iconUrl: "/talents/iron-fan-princess/palm-leaf-fan-power.png",
      },
      {
        kind: "enhance",
        name: "Windborne Steps",
        description:
          "After casting Palm-Leaf Fan·Wind, increase the MOV SPD of all allied heroes by 50% for 3s",
        unlockStars: 5,
        iconUrl: "/talents/iron-fan-princess/windborne-steps.png",
      },
      {
        kind: "special",
        name: "Palm-Leaf Fan·Fire",
        description:
          "At set intervals,, swing the fan to unleash a flame tornado forward to attack all enemies along the path, dealing Magic DMG equal to 125% of ATK. Enemies hit by the flame will have their Magic RES reduced by 20% for 5s",
        unlockStars: 8,
        iconUrl: "/talents/iron-fan-princess/palm-leaf-fan-fire.png",
      },
      {
        kind: "attribute",
        name: "Wind Guardian",
        description:
          "HP increased by 10%, Energy Recovery SPD increased by 15%",
        unlockStars: 12,
        iconUrl: "/talents/iron-fan-princess/wind-guardian.png",
      },
      {
        kind: "enhance",
        name: "Wind Fury",
        description:
          "Palm-Leaf Fan·Wind briefly stuns enemies when hitting them. The knockback effect and the flight distance of the hurricane increase by 25%",
        unlockStars: 16,
        iconUrl: "/talents/iron-fan-princess/wind-fury.png",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Palm-Leaf Fan·Wind",
        description:
          "「Palm-Leaf Fan·Wind」 Each hit deals additional Magic DMG equal to 13%(40%) of ATK",
      },
      {
        name: "Arcane Hat",
        skill: "Palm-Leaf Fan·Power",
        description:
          "「Palm-Leaf Fan·Force」 Trigger Chance increased by 10%(30%)",
      },
      {
        name: "Mage Robe",
        skill: "Windborne Steps",
        description:
          "「Windborne Steps」 Additionally increases Physical RES for all allied Heroes by 12%(36%)",
      },
      {
        name: "Spell Tome",
        skill: "Palm-Leaf Fan·Fire",
        description:
          "「Palm-Leaf Fan·Fire」 Deals additional True DMG equal to 30%(90%) of ATK",
      },
    ],
    divinities: ["ranged-dmg-boost", "dmg-increase"],
  },
  "otherworld-prisoner": {
    artifact: {
      name: "Magic Oath Mask",
      iconUrl: "/artifacts/otherworld-prisoner.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Ignite",
          description:
            '"Ignite" Targets inflicted with the Ignite effect will receive Magic DMG equal to 10% of ATK per second for 10s (stackable)',
        },
        {
          tier: "gold",
          skill: "Flame Impact",
          description:
            '"Flame Impact" Inflict 40% Speed Decrease effect within 3s of hitting the target.',
        },
        {
          tier: "red",
          skill: "Ignite",
          description:
            '"Ignite" Detonating conditions decreased to at least 2 stacks, stun duration increased to 1s',
        },
        {
          tier: "rainbow",
          name: "Energy Contract",
          description:
            "When an allied hero is defeated, increases an additional 45% of Energy.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Flame Impact",
        description:
          "Launch a fireball to the front, which will bounce among enemy targets for 3 time(s), dealing Magic DMG equal to 220% of ATK to enemies every time",
        unlockStars: 0,
        iconUrl: "/talents/otherworld-prisoner/flame-impact.png",
      },
      {
        kind: "battle",
        name: "Ignite",
        description:
          "Basic ATK will Ignite target and explode once it reaches 3 stacks, dealing Magic DMG equal to 200% of ATK and inflicting Stun for 1s. Each stack of Ignite will reduce the healing effect received by 20%",
        unlockStars: 2,
        iconUrl: "/talents/otherworld-prisoner/ignite.png",
      },
      {
        kind: "enhance",
        name: "Flame Enhancement",
        description: "Flame Impact Increases the Magic DMG dealt by 40%",
        unlockStars: 5,
        iconUrl: "/talents/otherworld-prisoner/flame-enhancement.png",
      },
      {
        kind: "enhance",
        name: "Imprint",
        description:
          "Flame Impact Increases the Magic DMG dealt by 40%, enemies hit by the flames will be inflicted with 1 stacks of Ignite effects.",
        unlockStars: 8,
        iconUrl: "/talents/otherworld-prisoner/imprint.png",
      },
      {
        kind: "attribute",
        name: "Passionate Soul",
        description: "ATK increased by 10%, CRIT Rate increased by 15%",
        unlockStars: 12,
        iconUrl: "/talents/otherworld-prisoner/passionate-soul.png",
      },
      {
        kind: "enhance",
        name: "Blazing Flames",
        description: "Flame Impact Release Flame Bullets’ Bounce Count +2",
        unlockStars: 16,
        iconUrl: "/talents/otherworld-prisoner/blazing-flames.png",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Flame Impact",
        description:
          "「Flame Impact」 deals additional Magic DMG equal to 15%(45%) of ATK",
      },
      {
        name: "Arcane Hat",
        skill: "Ignite",
        description:
          "「Ignite」 upon detonation inflicts additional Magic DMG equal to 30%(90%) of ATK",
      },
      {
        name: "Mage Robe",
        skill: "Flame Enhancement",
        description:
          "「Flame Enhancement」 inflicts additional Magic DMG equal to 15%(45%) of ATK",
      },
      {
        name: "Spell Tome",
        skill: "Imprint",
        description:
          "「Imprint」 inflicts additional Magic DMG equal to 15%(45%) of ATK",
      },
    ],
    divinities: ["hp", "magic-dmg-boost"],
  },
  wizard: {
    artifact: {
      name: "Dark Codex",
      iconUrl: "/artifacts/wizard.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Poison",
          description:
            '"Poison" Enemies entering a poisoned state will receive Magic DMG equal to 20% of ATK per second',
        },
        {
          tier: "gold",
          skill: "Curse",
          description:
            '"Curse" The Knockback Resist of cursed targets will be further reduced by 15%',
        },
        {
          tier: "red",
          skill: "Paralysis Potion",
          description:
            '"Paralysis Potion" Each hit on an enemy reduces their ATK by 15%, lasting for 8s (stackable)',
        },
        {
          tier: "rainbow",
          skill: "Curse",
          description:
            '"Curse" Cursed targets lose 50 energy points per second',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Paralysis Potion",
        description:
          "Throws a Paralysis Potion forward, which will bounce among enemy targets 3 times, dealing Magic DMG equal to 3% of ATK and stunning enemy targets for 1s",
        unlockStars: 0,
        iconUrl: "/talents/wizard/paralysis-potion.png",
      },
      {
        kind: "battle",
        name: "Poison",
        description:
          "Basic ATK will inflict a poisoned state lasting for 10s, reducing the target’s Physical RES by 8% (Cooldown: 5s)",
        unlockStars: 2,
        iconUrl: "/talents/wizard/poison.png",
      },
      {
        kind: "enhance",
        name: "Enhance Potion",
        description: "Paralysis Potion Enemies hit will lose 60 Energy points.",
        unlockStars: 5,
        iconUrl: "/talents/wizard/enhance-potion.png",
      },
      {
        kind: "special",
        name: "Curse",
        description:
          "At a set interval, curses 2 enemy target(s) nearest to the front. Increases the DMG received by the cursed target(s) by 20%, lasting for 6s.",
        unlockStars: 8,
        iconUrl: "/talents/wizard/curse.png",
      },
      {
        kind: "attribute",
        name: "Energy Regen",
        description: "Increases Energy Regen SPD by 25%",
        unlockStars: 12,
        iconUrl: "/talents/wizard/energy-regen.png",
      },
      {
        kind: "enhance",
        name: "Potent Potion",
        description:
          "Paralysis Potion Bounce count +2, stun duration extended by 0.5s",
        unlockStars: 16,
        iconUrl: "/talents/wizard/potent-potion.png",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Paralysis Potion",
        description:
          "「Paralysis Potion」 adds 30%(90%) of Attack as additional Magic DMG",
      },
      {
        name: "Tome of Radiance",
        skill: "Poison",
        description:
          "「Poison」 additionally reduces the target's Physical RES by 3%(10%)",
      },
      {
        name: "Luminous Visor",
        skill: "Enhance Potion",
        description:
          "「Enhance Potion」 additionally drains 10(30) points of enemy energy",
      },
      {
        name: "Resonance Pendant",
        skill: "Curse",
        description:
          "「Curse」 causes the target to suffer 3%(10%) additional DMG",
      },
    ],
    divinities: ["support-atk", "heavy-injury"],
  },
  templar: {
    artifact: {
      name: "Spectral Blade",
      iconUrl: "/artifacts/templar.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Phase Shift",
          description:
            "[Refraction] increases knockback effect by 10% for 8s after activation",
        },
        {
          tier: "gold",
          skill: "Psi Blade",
          description:
            "[Psi Blade] attacks have 50% chance to pierce 1 extra targets, and 30% chance to pierce 2 extra targets",
        },
        {
          tier: "red",
          skill: "Mind Trap",
          description:
            "[Mind Trap] auto-activates at battle start (unaffected by Illusory Nightmare on first use), trap radius +30%, and reduces target’s DMG reduction by 40% and healing received by 60% for 3s",
        },
        {
          tier: "rainbow",
          skill: "Phase Shift",
          description:
            "[Refraction] fires 1 more Psi Blades; shield duration increases 2.5s",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Phase Shift",
        description:
          "Creates a psychic shield around you for 5s, granting the following effects (recasting resets duration): Psi Blade: Fires 2 energy blades at enemies, each dealing 480% ATK as physical DMG and knocking them back. (Can trigger Psi Blade effect) Phase Deflect: While the shield is active, if a single hit exceeds 5% of your max HP, reduce its DMG by 80%",
        unlockStars: 0,
        iconUrl: "/talents/templar/phase-shift.png",
      },
      {
        kind: "battle",
        name: "Psi Blade",
        description:
          "After entering battle, gain 10% extra attack range and 30% chance to pierce through 1 additional enemies when attacking",
        unlockStars: 2,
        iconUrl: "/talents/templar/psi-blade.png",
      },
      {
        kind: "enhance",
        name: "Phase Boost",
        description: "Refraction Psi Blades deal 120% more physical DMG",
        unlockStars: 5,
        iconUrl: "/talents/templar/phase-boost.png",
      },
      {
        kind: "special",
        name: "Mind Trap",
        description:
          "Every 6s, places a psychic trap under the frontmost enemy. Affected enemies in range have their MOV SPD reduced by 25% for 3s",
        unlockStars: 8,
        iconUrl: "/talents/templar/mind-trap.png",
      },
      {
        kind: "passive",
        name: "Assassin Pact",
        description: "ATK increased by 10%, HP increased by 15%",
        unlockStars: 12,
        iconUrl: "/talents/templar/assassin-pact.png",
      },
      {
        kind: "enhance",
        name: "Shadow Rush",
        description:
          "Refraction energy cost for first release is reduced by 40%. Upon activation, increases ATK SPD by 60% for 8s",
        unlockStars: 16,
        iconUrl: "/talents/templar/shadow-rush.png",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Phase Shift",
        description:
          "「Phase Shift」 Phase Deflection: Triggers DMG reduction when a single hit exceeds 4.5(3.5)% of your max HP.",
      },
      {
        name: "Arrow Core",
        skill: "Phase Boost",
        description:
          "「Phase Boost」 Adds 30(90%)% of your Attack as bonus Physical DMG.",
      },
      {
        name: "Hunter's Cloak",
        skill: "Mind Trap",
        description:
          "「Mind Trap」 Additionally drains 1(3%)% of the enemy's max HP per second (cannot exceed 20(60%)% of the Templar's Attack).",
      },
      {
        name: "Crystal Pendant",
        skill: "Shadow Rush",
        description:
          "「Shadow Rush」 The first cast of Phase Shift additionally reduces its energy cost by 5(15%)% and grants an additional 10(30%)% attack speed.",
      },
    ],
    divinities: ["dmg-increase", "physical-dmg-boost"],
  },
  warlock: {
    artifact: {
      name: "Demon's Cloak",
      iconUrl: "/artifacts/warlock.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Cataclysm",
          description:
            '"Cataclysm" Further reduces all enemies\' Control RES by 30%',
        },
        {
          tier: "gold",
          skill: "Dark Word",
          description:
            '"Dark Word" If the target is an enemy unit, additionally reduces the enemy\'s Energy Regen SPD by 35%',
        },
        {
          tier: "red",
          skill: "Infernal",
          description:
            "[Infernal] Infernal immune to all skill damage and debuffs except for Basic ATK. The energy required to summon Infernal for the first time is reduced by 25%",
        },
        {
          tier: "rainbow",
          name: "Deadly Curse",
          description:
            "Curses an random enemy unit every 6s. The cursed unit takes 40% Magic DMG per second, and healing effect received by the unit is reduced by 80%. Effects last for 12s (Effect does not stack, and prioritizes uncursed enemies)",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Infernal",
        description:
          "Summons an Infernal from the Abyss, inheriting 70% of self base attributes. Upon appearance, the Infernal knocks back and stuns all enemies for 2s. The Infernal remains active for 10s",
        unlockStars: 0,
        iconUrl: "/talents/warlock/infernal.png",
      },
      {
        kind: "special",
        name: "Cataclysm",
        description:
          "Upon entering battle, triggers a fierce gust of wind, reducing the MOV SPD of all enemies by 20% per second for 5s (Cooldown: 13s)",
        unlockStars: 2,
        iconUrl: "/talents/warlock/cataclysm.png",
      },
      {
        kind: "enhance",
        name: "Hell Harbinger",
        description:
          "Infernal additionally inherits 70% of self special attributes, and surrounding flames can deal 150% Magic DMG per second to nearby enemies",
        unlockStars: 5,
        iconUrl: "/talents/warlock/hell-harbinger.png",
      },
      {
        kind: "special",
        name: "Dark Word",
        description:
          "Every 10s, casts Dark Word on the hero currently with the lowest HP. If the target is an enemy, it deals Magic DMG equal to 65% of ATK per second. If the target is an ally, it restores ally's HP equal to 65% of the Magic DMG per second, lasting for 6s",
        unlockStars: 8,
        iconUrl: "/talents/warlock/dark-word.png",
      },
      {
        kind: "attribute",
        name: "Corrupting Heart",
        description: "ATK increased by 10%, HP increased by 15%",
        unlockStars: 12,
        iconUrl: "/talents/warlock/corrupting-heart.png",
      },
      {
        kind: "enhance",
        name: "Hell Fist",
        description:
          "Infernal Damage dealt by Basic ATKs is converted to True DMG, and there is a 20% chance to stun the enemy for 1.5s",
        unlockStars: 16,
        iconUrl: "/talents/warlock/hell-fist.png",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Infernal",
        description:
          "「Infernal」 additionally inherits 10%(30%) of Base Attributes",
      },
      {
        name: "Tome of Radiance",
        skill: "Cataclysm",
        description:
          "「Cataclysm」 additionally reduces enemy Energy Regen by 5%(15%)",
      },
      {
        name: "Luminous Visor",
        skill: "Hell Harbinger",
        description:
          "「Hell Harbinger」 additionally inherits 5%(15%) of Special Attributes",
      },
      {
        name: "Resonance Pendant",
        skill: "Dark Word",
        description:
          "「Dark Word」 increases DMG and healing effects by 30%(90%) of Attack",
      },
    ],
    divinities: ["control-res", "healing-effect"],
  },
  "darkin-hunter": {
    artifact: {
      name: "Shadow Bow",
      iconUrl: "/artifacts/darkin-hunter.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Blight Quiver",
          description:
            "Increases the trigger chance for Withering Arrows from [Blight Quiver] by 5%.",
        },
        {
          tier: "gold",
          skill: "Pierce Bolt",
          description:
            "Piercing Arrows from [Pierce Bolt] apply 1 stack(s) of Blight Mark to all enemies.",
        },
        {
          tier: "red",
          skill: "Corrupt Chains",
          description:
            "The corrupting vine from [Corrupt Chains] spreads to nearby enemies, applying the same binding effect (including Blight Mark and Bonus Reduction) and dealing Physical DMG equal to 600% of ATK.",
        },
        {
          tier: "rainbow",
          name: "Ghost Rain",
          description:
            "Entering battle fires a volley dealing 250% ATK Physical DMG with knockback effect to frontal enemies. Applies 1 Blight Mark stacks. Ground is polluted for 15s, reducing enemy Healing by 50% and Energy Regen by 25%. Triggers again when self HP first falls below 45%.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Corrupt Chains",
        description:
          "Darkin Hunter hurls corrupt vines, dealing 880% ATK Physical DMG to 1 frontal enemies and Ensnaring them for 2s. Applies 1 Blight Mark stacks. At 4 stacks, marks detonate for 16% Max HP DMG to the target and nearby enemies (max 500% ATK). DMG triggers once per 0.5s",
        unlockStars: 0,
        iconUrl: "/talents/darkin-hunter/corrupt-chains.png",
      },
      {
        kind: "battle",
        name: "Blight Quiver",
        description:
          "Basic ATK have a 25% chance to fire Blight Arrows, dealing 8% Max HP DMG to 1 frontal enemies (max 250% ATK) with knockback. Applies 1 Blight Mark stacks",
        unlockStars: 2,
        iconUrl: "/talents/darkin-hunter/blight-quiver.png",
      },
      {
        kind: "enhance",
        name: "Chain Power",
        description: "Corrupt Chains Physical DMG increased 250%",
        unlockStars: 5,
        iconUrl: "/talents/darkin-hunter/chain-power.png",
      },
      {
        kind: "special",
        name: "Pierce Bolt",
        description:
          "Every 12s, fires a Pierce Bolt dealing 350% ATK Physical DMG to all enemies with Knockback effect.",
        unlockStars: 8,
        iconUrl: "/talents/darkin-hunter/pierce-bolt.png",
      },
      {
        kind: "passive",
        name: "Darkin Blood",
        description: "ATK increased by 10%, HP increased by 15%",
        unlockStars: 12,
        iconUrl: "/talents/darkin-hunter/darkin-blood.png",
      },
      {
        kind: "enhance",
        name: "Vine Bind",
        description:
          "Corrupt Chains Ensnare duration increase 1s. Hit targets lose 20% Ranged DMG Reduction for 6s",
        unlockStars: 16,
        iconUrl: "/talents/darkin-hunter/vine-bind.png",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Corrupt Chains",
        description:
          "[Corrupt Chains] increases Physical DMG by 150%(450%) of ATK",
      },
      {
        name: "Arrow Core",
        skill: "Blight Quiver",
        description:
          '"Blight Quiver" increases the trigger chance of Blight Arrow by 5%(15%)',
      },
      {
        name: "Hunter's Cloak",
        skill: "Pierce Bolt",
        description: "[Pierce Bolt] reduces the cooldown by 1(3)s",
      },
      {
        name: "Crystal Pendant",
        skill: "Vine Bind",
        description:
          "[Vine Bind] additionally reduces the target's Ranged DMG Reduction by 5%(15%)",
      },
    ],
    divinities: ["dmg-increase", "crit-rate"],
  },
  earthbreaker: {
    artifact: {
      name: "Battle Chant Drum",
      iconUrl: "/artifacts/earthbreaker.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Empowered Totem",
          description:
            "[Empowered Totem] reduces the target’s Energy Regen SPD by 20% per second for 6s",
        },
        {
          tier: "gold",
          skill: "Aftershock",
          description:
            "[Aftershock] Deals 300% ATK as Physical DMG to nearby enemies whenever any skill is cast",
        },
        {
          tier: "red",
          skill: "Empowered Totem",
          description:
            "[Empowered Totem] Converts its DMG into True DMG, and 80% of the DMG dealt is converted as Self HP",
        },
        {
          tier: "rainbow",
          name: "Echoing Slam",
          description:
            "Triggers 17s after entering battle, releasing an echo shockwave from beneath. Enemies within range with HP below 12% are instantly executed (execution ignores all statuses and revival effects; ineffective against bosses). Enemies not meeting the execution condition take 1350% ATK as Physical DMG with Knockback Effect. CD: 20s",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Fissure",
        description:
          "Smashes the ground with a totem, creating a rocky ridge that deals 560% ATK as Physical DMG to all enemies and stuns them for 1.5s",
        unlockStars: 0,
        iconUrl: "/talents/earthbreaker/fissure.png",
      },
      {
        kind: "battle",
        name: "Empowered Totem",
        description:
          "After 6s into battle, summons a totem to strike the frontmost enemy, dealing 400% ATK as Physical DMG with Knockback Effect. CD: 8s",
        unlockStars: 2,
        iconUrl: "/talents/earthbreaker/empowered-totem.png",
      },
      {
        kind: "enhance",
        name: "Rupture",
        description: "Fissure Increases the Physical DMG dealt by 140%",
        unlockStars: 5,
        iconUrl: "/talents/earthbreaker/rupture.png",
      },
      {
        kind: "special",
        name: "Aftershock",
        description:
          "When casting any skill, instantly stuns nearby enemies for 1s",
        unlockStars: 8,
        iconUrl: "/talents/earthbreaker/aftershock.png",
      },
      {
        kind: "passive",
        name: "Brawny",
        description: "ATK increased by 10%, HP increased by 15%",
        unlockStars: 12,
        iconUrl: "/talents/earthbreaker/brawny.png",
      },
      {
        kind: "enhance",
        name: "Shattered Ground",
        description:
          "Fissure Stun duration is increased by 1s. Enemies hit by Fissure additionally lose 17% Physical RES and 17% Magic RES for 8s",
        unlockStars: 16,
        iconUrl: "/talents/earthbreaker/shattered-ground.png",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Fissure",
        description:
          "「Fissure」 increases Physical DMG dealt by 80%(240%) of Attack",
      },
      {
        name: "Cavalier Helm",
        skill: "Empowered Totem",
        description:
          "「Empowered Totem」 increases Physical DMG dealt by 60%(180%) of Attack",
      },
      {
        name: "Brawler's Armor",
        skill: "Aftershock",
        description: "「Aftershock」 extends Stun duration by 0.3(1)s",
      },
      {
        name: "Brawler's Boots",
        skill: "Shattered Ground",
        description:
          "「Shattered Ground」 additionally reduces Enemies' Physical RES and Magic RES by 5%(15%)",
      },
    ],
    divinities: ["atk", "melee-dmg-boost"],
  },
  observer: {
    artifact: {
      name: "Shadow Pendant",
      iconUrl: "/artifacts/observer.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Ion Split",
          description:
            "[Ion Split] reduces hit enemies’ Energy Regen SPD by 15% per second for 5s",
        },
        {
          tier: "gold",
          skill: "Void Rift",
          description:
            "[Void Rift] is cast immediately upon entering combat, and also reduces enemies’ healing received by 60% for 5s",
        },
        {
          tier: "red",
          skill: "Annihilator",
          description:
            "[Annihilator] hits reduce enemies’ DMG Reduction by 20% for 6s; the ray then rebounds, dealing half of the Magic DMG in a sweeping attack to enemies along its path (enemies around the rebound point are unaffected)",
        },
        {
          tier: "rainbow",
          name: "Area Break",
          description:
            "triggers 6s after entering battle, decomposing and detonating an area 450 yards in front. All enemies within the area take Magic DMG equal to 200% ATK, CD: 13s",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Annihilator",
        description:
          "Fires 1 Annihilator rays forward, dealing Magic DMG equal to 330% ATK and Knockback",
        unlockStars: 0,
        iconUrl: "/talents/observer/annihilator.png",
      },
      {
        kind: "battle",
        name: "Ion Split",
        description:
          "Basic ATK have a 40% chance to launch a plasma. On hit, it splits, dealing Magic DMG equal to 200% ATK and Knockback enemies in the small area",
        unlockStars: 2,
        iconUrl: "/talents/observer/ion-split.png",
      },
      {
        kind: "enhance",
        name: "Ray Boost",
        description: "Annihilator Magic DMG increased by 80%",
        unlockStars: 5,
        iconUrl: "/talents/observer/ray-boost.png",
      },
      {
        kind: "special",
        name: "Void Rift",
        description:
          "Every 13s, creates a Void Rift, dealing True DMG equal to 90% ATK to all enemies",
        unlockStars: 8,
        iconUrl: "/talents/observer/void-rift.png",
      },
      {
        kind: "passive",
        name: "Void Force",
        description: "ATK increased by 10%, HP increased by 15%",
        unlockStars: 12,
        iconUrl: "/talents/observer/void-force.png",
      },
      {
        kind: "enhance",
        name: "Ray Charge",
        description:
          "Annihilator initial cast energy cost reduced by 15%. When the ray hits enemies, 15% of the DMG dealt is converted to self HP",
        unlockStars: 16,
        iconUrl: "/talents/observer/ray-charge.png",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Annihilator",
        description:
          "「Annihilator」 unleashes Magic DMG equal to 20%(60%) of ATK",
      },
      {
        name: "Arcane Hat",
        skill: "Ion Split",
        description:
          "「Ion Split」 inflicts Magic DMG equal to 50%(150%) of ATK",
      },
      {
        name: "Mage Robe",
        skill: "Void Rift",
        description:
          "Upon casting 「Void Rift」, all allied units gain 3%(10%) increased Ranged DMG Reduct for 10s",
      },
      {
        name: "Spell Tome",
        skill: "Ray Charge",
        description:
          "「Ray Charge」 additionally boosts the HP conversion ratio by 3%(9%)",
      },
    ],
    divinities: ["heavy-injury", "ranged-dmg-boost"],
  },
  "dark-shaman": {
    artifact: {
      name: "Voodoo Staff",
      iconUrl: "/artifacts/dark-shaman.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Celestial Shock",
          description:
            '"Celestial Shock" Hit targets\' DMG Bonus reduced by 10% for 4s.',
        },
        {
          tier: "gold",
          skill: "Hex",
          description: "[Hex] Target additionally loses 120 energy.",
        },
        {
          tier: "red",
          skill: "Serpent Ward",
          description:
            "[Serpent Ward] Summoned Serpent Ward count increased by 1. Each attack additionally reduces target's max HP by 1% (up to 24% of Serpent Ward's ATK).",
        },
        {
          tier: "rainbow",
          skill: "Hex",
          description:
            "[Hex] Number of transformed targets increased by 1. First cast time reduced by 4s. Transformed targets' Ranged DMG Reduct reduced by 20%.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Serpent Ward",
        description:
          "Summon 2 Serpent Ward(s) from behind. Serpent Wards inherit 80% of the caster's ATK and 80% of special stats. Serpent Wards deal Magic DMG equal to 130% ATK to a random enemy per second with Knockback effect, lasting 5s. Serpent Wards are immobile and untargetable.",
        unlockStars: 0,
        iconUrl: "/talents/dark-shaman/serpent-ward.png",
      },
      {
        kind: "battle",
        name: "Celestial Shock",
        description:
          "Unleashed 4s after battle starts, uses void energy to create forked lightning, striking all enemies, dealing Magic DMG equal to 200% ATK with Knockback effect, subsequent cooldown 11s.",
        unlockStars: 2,
        iconUrl: "/talents/dark-shaman/celestial-shock.png",
      },
      {
        kind: "enhance",
        name: "Enhanced Ward",
        description:
          "Serpent Ward Damage per second dealt by Serpent Wards increased by 30%.",
        unlockStars: 5,
        iconUrl: "/talents/dark-shaman/enhanced-ward.png",
      },
      {
        kind: "special",
        name: "Hex",
        description:
          "Every 10s, affect 1 random enemy heroes, turning them into harmless chickens, unable to move or attack for 3s. Duration of transformation on Support heroes is doubled (if multiple transformation effects exist, show the transformation animation with longer duration; all attached debuffs take effect).",
        unlockStars: 8,
        iconUrl: "/talents/dark-shaman/hex.png",
      },
      {
        kind: "passive",
        name: "Troll Bloodline",
        description: "ATK increased by 10%, HP increased by 15%.",
        unlockStars: 12,
        iconUrl: "/talents/dark-shaman/troll-bloodline.png",
      },
      {
        kind: "enhance",
        name: "Serpent Urn",
        description:
          "Serpent Ward Serpent Wards' inherited ATK and special stat bonus increased by 20%, duration increased by 2s.",
        unlockStars: 16,
        iconUrl: "/talents/dark-shaman/serpent-urn.png",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Serpent Ward",
        description:
          "「Serpent Wards」 Serpent Ward's damage per second increased by 20%(60%) of Attack as Magic DMG",
      },
      {
        name: "Tome of Radiance",
        skill: "Celestial Shock",
        description:
          "「Celestial Shock」 Subsequent cooldown reduced by 1(3) seconds",
      },
      {
        name: "Luminous Visor",
        skill: "Hex",
        description:
          "「Hex」 Transformation duration increased by 0.5(1.5) seconds",
      },
      {
        name: "Resonance Pendant",
        skill: "Serpent Urn",
        description:
          "「Serpent Urn」 Serpent Ward's inherited Attack attribute increased by 7%(20%)",
      },
    ],
    divinities: ["support-atk", "magic-dmg-boost"],
  },
  hellscream: {
    artifact: {
      name: "Tribe's Judgment",
      iconUrl: "/artifacts/hellscream.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Earth Shatter",
          description:
            "「Earth Shatter」 additionally reduces target's DEF by 8%.",
        },
        {
          tier: "gold",
          skill: "Bloodlust",
          description: "Reduces the recast interval of 「Bloodlust」 by 3.5s.",
        },
        {
          tier: "red",
          skill: "War Cry",
          description:
            "After casting 「War Cry」, Hellscream is surrounded by the power of Y'Shaarj, becoming immune to control effects and critical strikes for 6s, while increasing his Armor Break Resistance by 15%.",
        },
        {
          tier: "rainbow",
          name: "Heart of Y'Shaarj",
          description:
            "[New] 「Heart of Y'Shaarj」 triggers upon taking fatal damage, restoring 25% HP and knocking back nearby enemies, entering Corrupted Form: ATK increases by 35% and gains immunity to all Skill DMG and negative effects except basic attacks for 5s. Each enemy death during this period, the duration is extended by 1s, up to a maximum of 2s. (Triggers at most once per battle.)",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "War Cry",
        description:
          "Unleashes a battlefield-shaking roar, dealing Physical DMG equal to 480% of ATK to all enemies and knocking them back. Taunts enemies for 1.5s. While taunted, enemies can only use basic attacks. Additionally, taunted enemies deal 15% less DMG to Hellscream for 6s.",
        unlockStars: 0,
        iconUrl: "/talents/hellscream/war-cry.png",
      },
      {
        kind: "battle",
        name: "Bloodlust",
        description:
          "6s after battle starts, unleashes Bloodlust Strike, dealing True DMG equal to 300% of ATK to the front 1 enemies and knocking them back, while restoring 6% of Max HP. If own HP is below 40%, the healing effect is doubled. Cooldown: 12s.",
        unlockStars: 2,
        iconUrl: "/talents/hellscream/bloodlust.png",
      },
      {
        kind: "enhance",
        name: "For the Tribe",
        description: "Increases Physical DMG dealt by War Cry by 120%.",
        unlockStars: 5,
        iconUrl: "/talents/hellscream/for-the-tribe.png",
      },
      {
        kind: "special",
        name: "Earth Shatter",
        description:
          "Every 11s, swings his battleaxe to shatter the ground, causing rocks to burst forward, dealing Physical DMG equal to 450% of ATK to enemies in a frontal area and knocking them back, while reducing their DEF by 12% for 5s.",
        unlockStars: 8,
        iconUrl: "/talents/hellscream/earth-shatter.png",
      },
      {
        kind: "passive",
        name: "Orc Bloodline",
        description: "Increases ATK by 10% and HP by 15%.",
        unlockStars: 12,
        iconUrl: "/talents/hellscream/orc-bloodline.png",
      },
      {
        kind: "enhance",
        name: "Ancient Energy",
        description:
          "Reduces the Energy required to cast War Cry by 10%. After casting, Hellscream gains 15% DMG reduction and 15% knockback resistance for 6s.",
        unlockStars: 16,
        iconUrl: "/talents/hellscream/ancient-energy.png",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "War Cry",
        description:
          "「War Cry」 increases Physical DMG by 70%(210%) of ATK, and taunt duration increases by 0.3(1)s",
      },
      {
        name: "Cavalier Helm",
        skill: "Bloodlust",
        description:
          "「Bloodlust」 increases True damage by 40%(120%) of ATK, and additionally restores 1%(3%) of Max HP",
      },
      {
        name: "Brawler's Armor",
        skill: "Earth Shatter",
        description:
          "「Earth Shatter」 reduces initial cast interval by 1(3)s, and hit targets additionally lose 6%(18%) Physical Resistance",
      },
      {
        name: "Brawler's Boots",
        skill: "Ancient Energy",
        description:
          "「Ancient Energy」 additionally reduces required Energy by 2%(6%), and additionally increases DMG Reduction after casting by 3%(10%)",
      },
    ],
    divinities: ["melee-dmg-reduction", "knockback-effect"],
  },
  "bone-archer": {
    artifact: {
      name: "Blood Bow",
      iconUrl: "/artifacts/bone-archer.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Specter Curse",
          description:
            '"Specter Curse" When dealing damage to enemies, reduces their healing received by 40% for 6s',
        },
        {
          tier: "gold",
          skill: "Rapid Fire",
          description:
            '"Rapid Fire" Immediately releases Rapid Fire once upon entering battle, and increases MOV SPD by 40% for the duration of Rapid Fire',
        },
        {
          tier: "red",
          skill: "Deathly Pact",
          description:
            '"Deathly Pact" When firing flaming arrows, there is a 65% chance to launch an additional flaming arrow (the extra arrow does not consume energy). Enemies hit by the flaming arrow will lose 70 energy',
        },
        {
          tier: "rainbow",
          name: "Shadows Veil",
          description:
            "[New] [Shadows Veil] Increases 2% DMG Reduction and 3% CRIT Rate for every 10% of max HP lost. Reduces DMG by 35% when taking single DMG exceeding 25% of max HP (Cooldown: 10s)",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Deathly Pact",
        description:
          "Activates Deathly Pact when energy is full, increasing ATK SPD by 250% / ATK Range by 30% / ATK by 20%. Basic ATKs convert to flaming arrow, dealing Physical DMG equal to 150% of ATK to enemies. Flaming arrows inherit 75% of self knockback effect, consuming 170 energy with each shot. Deathly Pact deactivates when energy falls below 170",
        unlockStars: 0,
        iconUrl: "/talents/bone-archer/deathly-pact.png",
      },
      {
        kind: "battle",
        name: "Specter Curse",
        description:
          "When dealing DMG to enemies, ignores 40% of the enemy's DEF",
        unlockStars: 2,
        iconUrl: "/talents/bone-archer/specter-curse.png",
      },
      {
        kind: "enhance",
        name: "Flaming Arrow",
        description:
          "Deathly Pact Physical DMG dealt by flaming arrows increased by 45%",
        unlockStars: 5,
        iconUrl: "/talents/bone-archer/flaming-arrow.png",
      },
      {
        kind: "special",
        name: "Rapid Fire",
        description:
          "Every 9s, increases ATK SPD by 200% and Physical DMG Boost by 12% for 6s",
        unlockStars: 8,
        iconUrl: "/talents/bone-archer/rapid-fire.png",
      },
      {
        kind: "passive",
        name: "Undead Body",
        description: "Armor PEN increased by 10%, ATK increased by 15%",
        unlockStars: 12,
        iconUrl: "/talents/bone-archer/undead-body.png",
      },
      {
        kind: "enhance",
        name: "Revenant Pact",
        description:
          "Deathly Pact Grants immunity to most debuffs and control effects during its duration. Upon the first activation, permanently increases HP Regen effect by 1.8%",
        unlockStars: 16,
        iconUrl: "/talents/bone-archer/revenant-pact.png",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Deathly Pact",
        description:
          "「Deathly Pact」 Reduces the flaming arrow's energy cost by 10(30) points.",
      },
      {
        name: "Arrow Core",
        skill: "Specter Curse",
        description: "「Specter Curse」 Ignores 10%(30%) of Enemies' DEF Boost",
      },
      {
        name: "Hunter's Cloak",
        skill: "Flaming Arrow",
        description:
          "「Flaming arrow」 Increases Attack's Physical DMG by 20%(60%)",
      },
      {
        name: "Crystal Pendant",
        skill: "Revenant Pact",
        description:
          "「Revenant Pact」 Upon taking cumulative DMG equal to 25% of Max HP, instantly restores 4%(12%) of Max HP. Permanent.",
      },
    ],
    divinities: ["marksman-def", "crit-rate"],
  },
  "dark-queen": {
    artifact: {
      name: "Whispers of Death",
      iconUrl: "/artifacts/dark-queen.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Dark Arrow",
          description:
            "Increases the knockback effect of 「Dark Arrow」 by 60%.",
        },
        {
          tier: "gold",
          skill: "Dread Arrow",
          description:
            "After casting 「Dread Arrow」, Dark Queen gains 50% ATK SPD and 100% control immunity for 6s. During this period, her basic attacks become Split Arrows, attacking 3 enemies in front, with each Split Arrow dealing Physical DMG equal to 100% of ATK.",
        },
        {
          tier: "red",
          skill: "Withering Shot",
          description:
            "「Withering Shot」 converts 35% of the DMG dealt by each Withering Arrow into HP for Dark Queen.",
        },
        {
          tier: "rainbow",
          name: "Banshee Form",
          description:
            "[New] 「Banshee Form」 triggers when HP first drops below 55%. Dark Queen restores 35% of Max HP and enters Banshee Form for 8s: increasing ATK by 30% and reducing DMG taken by 30%.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Dread Arrow",
        description:
          "Dark Queen fires a Dread Arrow forward, targeting the 1 enemy with the highest ATK, dealing Physical DMG equal to 520% of ATK to that target and 2 random enemies within 200 yards, and spreading a fearful aura that reduces enemy ATK SPD by 20% for 6s. DMG from Dread Arrow does not grant enemies Energy.",
        unlockStars: 0,
        iconUrl: "/talents/dark-queen/dread-arrow.png",
      },
      {
        kind: "battle",
        name: "Dark Arrow",
        description:
          "6s after battle starts, Dark Queen fires 1 Dark Arrows, dealing Physical DMG equal to 450% of ATK to the front 1 enemies and knocking them back, while silencing them for 3s. Cooldown: 12s.",
        unlockStars: 2,
        iconUrl: "/talents/dark-queen/dark-arrow.png",
      },
      {
        kind: "enhance",
        name: "Wail of the Dead",
        description:
          "Increases Physical DMG dealt by Dread Arrow by 140% of ATK.",
        unlockStars: 5,
        iconUrl: "/talents/dark-queen/wail-of-the-dead.png",
      },
      {
        kind: "special",
        name: "Withering Shot",
        description:
          "Every 11s, Dark Queen rapidly fires 5 Withering Arrows. Each arrow deals True DMG equal to 80% of ATK to 1 random enemies (prioritizing ranged) and knocks them back.",
        unlockStars: 8,
        iconUrl: "/talents/dark-queen/withering-shot.png",
      },
      {
        kind: "passive",
        name: "Ranger General",
        description: "Increases ATK by 10% and HP by 15%.",
        unlockStars: 12,
        iconUrl: "/talents/dark-queen/ranger-general.png",
      },
      {
        kind: "enhance",
        name: "Surging Energy",
        description:
          "Reduces the Energy required to initial cast Dread Arrow by 20%. Hit enemies' energy recovery rate is additionally reduced by 15% for 6s.",
        unlockStars: 16,
        iconUrl: "/talents/dark-queen/surging-energy.png",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Dread Arrow",
        description:
          "「Dread Arrow」 increases Physical DMG by 80%(240%) of ATK, and additionally reduces target's ATK SPD by 5%(15%)",
      },
      {
        name: "Arrow Core",
        skill: "Dark Arrow",
        description:
          "「Dark Arrow」 increases DMG by 100%(300%), and reduces subsequent cooldown by 1(3)s",
      },
      {
        name: "Hunter's Cloak",
        skill: "Withering Shot",
        description:
          "「Withering Shot」 increases the number of Withering Arrows by 1(3)",
      },
      {
        name: "Crystal Pendant",
        skill: "Surging Energy",
        description:
          "「Surging Energy」 additionally reduces initial required energy by 3%(10%), and hit enemies' energy recovery rate is additionally reduced by 2%(6%)",
      },
    ],
    divinities: ["physical-dmg-boost", "dmg-reduction"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 10.10.23 AM.png, 9.58.29 AM.png, 9.58.31 AM.png, 9.58.32 AM.png, 9.58.33 AM.png, 9.58.35 AM.png.
  // Talent/core continuations: 9.58.30 AM.png, 10.10.23 AM.png, 10.10.48 AM.png.
  // Artifact tab: 9.58.42 AM.png; abilities: 9.58.43 AM.png.
  // Blizzard icon uses the fully visible 9.58.26 AM ring; see the crop override.
  snowoman: {
    artifact: {
      name: "Soulseeker Staff",
      iconUrl: "/artifacts/snowoman.png",
      bonuses: [
        {
          tier: "purple",
          name: "Ice Seal Technique",
          description:
            "Basic ATK will have a 75% chance to freeze the target for 1s",
        },
        {
          tier: "gold",
          skill: "Blizzard",
          description:
            '"Blizzard" Increases the Magic DMG dealt per wave of Blizzard by 50%. Enemies struck by Blizzard has a 50% chance to be frozen for 1s.',
        },
        {
          tier: "red",
          skill: "Ice Blast",
          description:
            '"Ice Blast Technique" Released immediately upon entering the battlefield, then released once every 12s, with a 100% chance to freeze the target for 1.5s.',
        },
        {
          tier: "rainbow",
          skill: "Glorious Aura",
          description:
            '"Glorious Aura" Increases the Energy regen rate every 3s by 15 points, and recovers 30 Energy points for the self.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Blizzard",
        unlockStars: 0,
        iconUrl: talent("snowoman", "blizzard"),
        description:
          'Summon 3 wave of Blizzard to attack enemies within range. Each wave of "Blizzard" will deal Magic DMG equal to 80% of ATK',
      },
      {
        kind: "special",
        name: "Ice Blast",
        unlockStars: 2,
        iconUrl: talent("snowoman", "ice-blast"),
        description:
          "Upon entering the Battlefield, release a Frost Explosion toward the enemies. The explosion will deal Magic DMG equal to 120% of ATK to the enemies within range and reduce their MOV SPD by 40% for 3s",
      },
      {
        kind: "enhance",
        name: "Bone-Chilling Cold",
        unlockStars: 5,
        iconUrl: talent("snowoman", "bone-chilling-cold"),
        description:
          "Blizzard Reduces the MOV SPD of hit enemies by 35% within 1.5s",
      },
      {
        kind: "aura",
        name: "Glorious Aura",
        unlockStars: 8,
        iconUrl: talent("snowoman", "glorious-aura"),
        description: "Restore 40 energy to all allied heroes every 3s",
      },
      {
        kind: "attribute",
        name: "Ice Purification",
        unlockStars: 12,
        iconUrl: talent("snowoman", "ice-purification"),
        description: "HP increased by 15%, Energy Regen SPD increased by 10%",
      },
      {
        kind: "enhance",
        name: "Storm Domain",
        unlockStars: 16,
        iconUrl: talent("snowoman", "storm-domain"),
        description:
          "Blizzard Increases the DMG dealt per wave by 30%. Increases the range of Blizzard by 20%.",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Blizzard",
        description: '"Blizzard" increases Magic DMG by 20%(60%) of Attack',
      },
      {
        name: "Tome of Radiance",
        skill: "Ice Blast",
        description: '"Ice Blast" increases Magic DMG by 50%(150%) of Attack',
      },
      {
        name: "Luminous Visor",
        skill: "Bone-Chilling Cold",
        description:
          '"Bone-Chilling Cold" extends the slow duration by 0.5(1.5) s',
      },
      {
        name: "Resonance Pendant",
        skill: "Glorious Aura",
        description:
          '"Glorious Aura" additionally restores 5(15) Energy each time',
      },
    ],
    divinities: ["support-atk", "melee-dmg-reduction"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 9.58.54 AM.png, 9.58.47 AM.png, 9.58.49 AM.png, 9.58.50 AM.png, 9.58.52 AM.png, 9.58.53 AM.png.
  // Talent/core continuations: 9.58.48 AM.png.
  // Artifact tab: 9.58.56 AM.png; abilities: 9.58.57 AM.png.
  "bamboo-hat": {
    artifact: {
      name: "Witherwood Staff",
      iconUrl: "/artifacts/bamboo-hat.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Weakness Sensing",
          description:
            '"Weakness Sensing" Basic ATK will bypass Blocks and EVA.',
        },
        {
          tier: "gold",
          skill: "Qi Mantra",
          description:
            '"Qi Consolidation Mantra" Allied heroes will recover HP equivalent to 200% of the Bamboo Hat’s ATK',
        },
        {
          tier: "red",
          skill: "Energy Impact",
          description:
            '"Energy Impact" Reduces the ATK SPD of targets hit by Energy Impact by 50%, lasting for 5s',
        },
        {
          tier: "rainbow",
          skill: "Weakness Sensing",
          description:
            '"Weakness Sensing" Basic ATK will reduce target\'s Energy by 80 points',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Energy Impact",
        unlockStars: 0,
        iconUrl: talent("bamboo-hat", "energy-impact"),
        description:
          "Gather energy to release an attack wave, dealing Magic DMG equal to 180% of ATK to all enemy targets and reduces energy by 80",
      },
      {
        kind: "battle",
        name: "Weakness Sensing",
        unlockStars: 2,
        iconUrl: talent("bamboo-hat", "weakness-sensing"),
        description:
          "Basic Attacks additionally shred 3% of the target's Current HP.",
      },
      {
        kind: "enhance",
        name: "Energy Overload",
        unlockStars: 5,
        iconUrl: talent("bamboo-hat", "energy-overload"),
        description:
          "Energy Impact Randomly deals 1.2~1.5 times DMG to the target",
      },
      {
        kind: "special",
        name: "Qi Mantra",
        unlockStars: 8,
        iconUrl: talent("bamboo-hat", "qi-mantra"),
        description:
          "At set intervals, Bamboo Hat will grant 150 Energy points to the team member with the highest Energy Level",
      },
      {
        kind: "attribute",
        name: "ATK Amplification",
        unlockStars: 12,
        iconUrl: talent("bamboo-hat", "atk-amplification"),
        description: "Increases ATK by 25%",
      },
      {
        kind: "enhance",
        name: "Energy Burst",
        unlockStars: 16,
        iconUrl: talent("bamboo-hat", "energy-burst"),
        description:
          "Energy Impact Increases the Magic DMG dealt by 50%. Increases 80 Energy to all allied heroes when released.",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Energy Impact",
        description:
          "「Energy Impact」 additionally drains the target's energy by 20(60) points",
      },
      {
        name: "Arcane Hat",
        skill: "Weakness Sensing",
        description:
          "「Weakness Sensing」 additionally reduces the target's Current HP by 0.5%(1.5%) (up to 115%(150%) of Bamboo Hat's Attack)",
      },
      {
        name: "Mage Robe",
        skill: "Qi Mantra",
        description: "「Qi Mantra」 additionally restores 30(90) Energy",
      },
      {
        name: "Spell Tome",
        skill: "Energy Burst",
        description:
          "「Energy Burst」 additionally grants all allied Heroes 20(60) Energy",
      },
    ],
    divinities: ["hp", "ranged-dmg-reduction"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 9.59.17 AM.png, 9.59.02 AM.png, 9.59.11 AM.png, 9.59.13 AM.png, 9.59.14 AM.png, 9.59.15 AM.png.
  // Talent/core continuations: 9.59.09 AM.png.
  // Artifact tab: 9.59.18 AM.png; abilities: 9.59.19 AM.png, 9.59.20 AM.png.
  "fire-sorceress": {
    artifact: {
      name: "Flame Crown",
      iconUrl: "/artifacts/fire-sorceress.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Burn",
          description:
            '"Burn" Enemies that enter the state of Burn will receive 12% Magic DMG per second.',
        },
        {
          tier: "gold",
          skill: "Burn",
          description:
            '"Burn" Further lowers the Magic RES of the target by 15%',
        },
        {
          tier: "red",
          name: "Blazing Fire",
          description:
            "At set intervals, summon a flame to randomly attack 1 enemy unit(s). The flames will deal Magic DMG equal to 200% of ATK to enemies in the target range with 1s of stun",
        },
        {
          tier: "rainbow",
          name: "Blazing Fire",
          description:
            "Increases the DMG range by 20%, while recovering 40 Energy points within 5s after skill use.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Flame Shock",
        unlockStars: 0,
        iconUrl: talent("fire-sorceress", "flame-shock"),
        description:
          "Release Flame Shock to the front and deal Magic DMG equal to 280% of ATK to enemies within the range. The first target hit by the flame will be knocked back substantially",
      },
      {
        kind: "battle",
        name: "Burn",
        unlockStars: 2,
        iconUrl: talent("fire-sorceress", "burn"),
        description:
          "Basic ATK will cause target to enter a burn state for 10s, reducing the target’s DEF by 8% (Cooldown: 5s)",
      },
      {
        kind: "enhance",
        name: "Blazing Slash",
        unlockStars: 5,
        iconUrl: talent("fire-sorceress", "blazing-slash"),
        description:
          "Flame Shock Enemies hit will reduce an additional 5% of Max HP (must not exceed 200% of the Fire Sorceress’s ATK)",
      },
      {
        kind: "enhance",
        name: "Blaze",
        unlockStars: 8,
        iconUrl: talent("fire-sorceress", "blaze"),
        description:
          "Flame Shock Within 15s of release, increases ATK SPD by 8% and CRIT Rate by 15%",
      },
      {
        kind: "attribute",
        name: "ATK Amplification",
        unlockStars: 12,
        iconUrl: talent("fire-sorceress", "atk-amplification"),
        description: "ATK increased by 15%, ATK SPD increased by 10%",
      },
      {
        kind: "enhance",
        name: "Enhance Impact",
        unlockStars: 16,
        iconUrl: talent("fire-sorceress", "enhance-impact"),
        description:
          "Flame Shock Increases the Magic DMG dealt by 100%, stunning hit target for 1s",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Flame Shock",
        description:
          "「Flame Shock」 Adds 20(60%)% of your Attack as bonus Magic DMG.",
      },
      {
        name: "Arcane Hat",
        skill: "Burn",
        description:
          "「Burn」 additionally reduces the target's DEF by 3%(10%)",
      },
      {
        name: "Mage Robe",
        skill: "Blaze",
        description:
          "「Blaze」 additionally increases ATK SPD and CRIT Rate by 2%(6%)",
      },
      {
        name: "Spell Tome",
        skill: "Enhance Impact",
        description: "「Enhance Impact」 increases stun duration by 0.5(1.5) s",
      },
    ],
    divinities: ["mage-atk", "magic-res"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 9.59.34 AM.png, 9.59.24 AM.png, 9.59.25 AM.png, 9.59.26 AM.png, 9.59.32 AM.png, 9.59.33 AM.png.
  // Talent/core continuations: 9.59.31 AM.png, 9.59.35 AM.png.
  // Artifact tab: 9.59.37 AM.png; abilities: 9.59.38 AM.png.
  "red-hood": {
    artifact: {
      name: "Captain Headgear",
      iconUrl: "/artifacts/red-hood.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Poisoned Shooting",
          description:
            '"Poisoned Shooting" Increase effect duration by 5s and reduce Magic RES by 8%.',
        },
        {
          tier: "gold",
          skill: "Time Bomb",
          description:
            '"Time Bomb" Increases the explosion range by 25%, inflicting 75% Speed Decrease effects within 2 upon explosion.',
        },
        {
          tier: "red",
          skill: "Mushroom Bomb",
          description:
            '"Mushroom Bomb" Enemies will be stunned for 2.5s when hit.',
        },
        {
          tier: "rainbow",
          skill: "Mushroom Bomb",
          description:
            '"Mushroom Bomb" Summon from 1 to 2 more Mushroom Bombs upon release',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Mushroom Bomb",
        unlockStars: 0,
        iconUrl: talent("red-hood", "mushroom-bomb"),
        description:
          "Summon 2 Mushroom Bomb to attack enemies. The Mushroom Bomb will automatically explode when encountering the enemy, dealing Magic DMG equal to 150% of ATK to targets in range, reducing the target’s DEF by 20%, lasting for 5s",
      },
      {
        kind: "battle",
        name: "Poisoned Shooting",
        unlockStars: 2,
        iconUrl: talent("red-hood", "poisoned-shooting"),
        description:
          "Basic ATK will reduce the target’s Physical RES by 8%, lasting for 5s, up to 2 stacks",
      },
      {
        kind: "enhance",
        name: "Here comes the bomb",
        unlockStars: 5,
        iconUrl: talent("red-hood", "here-comes-the-bomb"),
        description: "Mushroom Bomb Summon Count +1",
      },
      {
        kind: "battle",
        name: "Time Bomb",
        unlockStars: 8,
        iconUrl: talent("red-hood", "time-bomb"),
        description:
          "At set intervals, place a Mushroom Bomb in front of the enemy at the forefront. It will automatically detonate after 3s, dealing Magic DMG equal to 150% of ATK to targets within range",
      },
      {
        kind: "attribute",
        name: "I am Red Hood",
        unlockStars: 12,
        iconUrl: talent("red-hood", "i-am-red-hood"),
        description: "ATK increased by 15%, ATK SPD increased by 10%",
      },
      {
        kind: "enhance",
        name: "Big-headed Mushroom",
        unlockStars: 16,
        iconUrl: talent("red-hood", "big-headed-mushroom"),
        description:
          "Mushroom Bomb Increases the explosion range by 25%, increasing the Magic DMG dealt by 50%.",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Mushroom Bomb",
        description:
          "「Mushroom Bomb」 additionally reduces the target's DEF by 10%(30%)",
      },
      {
        name: "Arcane Hat",
        skill: "Poisoned Shooting",
        description:
          "「Poisoned Shooting」 additionally reduces the target's Physical RES by 2%(6%)",
      },
      {
        name: "Mage Robe",
        skill: "Time Bomb",
        description:
          "「Time Bomb」 deals additional Magic DMG equal to 50%(150%) of ATK",
      },
      {
        name: "Spell Tome",
        skill: "Big-headed Mushroom",
        description:
          "「Big-headed Mushroom」 each bomb deals additional Magic DMG equal to 15%(45%) of ATK",
      },
    ],
    divinities: ["receive-healing", "knockback-resist"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 9.59.47 AM.png, 9.59.41 AM.png, 9.59.42 AM.png, 9.59.43 AM.png, 9.59.45 AM.png, 9.59.46 AM.png.
  // Talent/core continuations: 9.59.44 AM.png, 9.59.48 AM.png.
  // Artifact tab: 9.59.50 AM.png; abilities: 9.59.51 AM.png.
  "little-goblin": {
    artifact: {
      name: "Goblin Wrench",
      iconUrl: "/artifacts/little-goblin.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Throw Mastery",
          description:
            '"Throw Mastery" Basic ATK has a 30% chance to throw another wrench.',
        },
        {
          tier: "gold",
          skill: "DEF Formation",
          description:
            '"DEF Formation" Increases the Shield\'s greatest HP Effect by 15%',
        },
        {
          tier: "red",
          skill: "Master of Machinery",
          description:
            '"Master of Machinery" Increases the Magic DMG dealt by hammers and wrenches by 30%, and recovers 200 points of Energy once the skill is used.',
        },
        {
          tier: "rainbow",
          name: "Energy Recharge Shield",
          description:
            "Randomly generates a shield equal to 30% of a Little Goblin’s Max HP to an allied hero every 12s.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Master of Machinery",
        unlockStars: 0,
        iconUrl: talent("little-goblin", "master-of-machinery"),
        description:
          "Throw 3~5 hammers or wrenches at a random enemy target. Hammer deals Magic DMG and greatly knocks back target equal to 150% of ATK within range. The wrenches deal Magic DMG equal to 80% of ATK and slightly knock back enemies",
      },
      {
        kind: "battle",
        name: "Throw Mastery",
        unlockStars: 2,
        iconUrl: talent("little-goblin", "throw-mastery"),
        description: "Basic ATK has a 30% chance of throwing out a hammer.",
      },
      {
        kind: "enhance",
        name: "Quick Release",
        unlockStars: 5,
        iconUrl: talent("little-goblin", "quick-release"),
        description:
          "Master of Machinery Reduces the Energy for first release by 20%, increases the Knockback Effect by 20%.",
      },
      {
        kind: "special",
        name: "DEF Formation",
        unlockStars: 8,
        iconUrl: talent("little-goblin", "def-formation"),
        description:
          "Upon entering the battlefield, grants the allied hero at the very front a shield equal to 35% of the Little Goblin’s Max HP. The shield will increase Physical Res and Magic RES of the allied hero by 10%, lasting for 10s.",
      },
      {
        kind: "attribute",
        name: "Knockback Boost",
        unlockStars: 12,
        iconUrl: talent("little-goblin", "knockback-boost"),
        description: "Knockback effect increased by 15%, HP increased by 10%",
      },
      {
        kind: "enhance",
        name: "Spare Tool",
        unlockStars: 16,
        iconUrl: talent("little-goblin", "spare-tool"),
        description: "Master of Machinery No. of weapons per throw+2",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Master of Machinery",
        description:
          "「Master of Machinery」 increases both the upper and lower limits of throw count by 1(3)",
      },
      {
        name: "Arcane Hat",
        skill: "Throw Mastery",
        description:
          "「Throw Mastery」 increases additional throw chance by 5%(15%)",
      },
      {
        name: "Mage Robe",
        skill: "Quick Release",
        description:
          "「Quick Release」 additionally reduces First release energy cost by 5%(15%)",
      },
      {
        name: "Spell Tome",
        skill: "DEF Formation",
        description:
          "「DEF Formation」 additionally increases Physical RES and Magic RES by 5%(15%)",
      },
    ],
    divinities: ["mage-atk", "heavy-injury"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 10.00.02 AM.png, 9.59.55 AM.png, 9.59.57 AM.png, 9.59.58 AM.png, 10.00.00 AM.png, 10.00.01 AM.png.
  // Talent/core continuations: 10.00.03 AM.png.
  // Artifact tab: 10.00.05 AM.png; abilities: 10.00.05 AM 1.png, 10.00.06 AM.png.
  "radiant-angel": {
    artifact: {
      name: "Angel Staff",
      iconUrl: "/artifacts/radiant-angel.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Judgement",
          description:
            '"Judgement" Increases trigger chance by 8%, and increases the Magic ATK DMG dealt by 50%',
        },
        {
          tier: "gold",
          skill: "Holy Light Protection",
          description:
            '"Holy Light Protection" Unable to receive CRIT when the skill is in effect',
        },
        {
          tier: "red",
          skill: "Holy Light Shines",
          description:
            '"Holy Light Shines" When used, recovers an additional 150 Energy points for the target.',
        },
        {
          tier: "rainbow",
          skill: "Holy Light Protection",
          description:
            '"Holy Light Protection" Releases an additional Holy Light Protection that will shield other allied heroes and increase their ATK by 200%. Unable to receive CRIT when the skill is in effect.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Holy Light Protection",
        unlockStars: 0,
        iconUrl: talent("radiant-angel", "holy-light-protection"),
        description:
          "Creates a Holy Light Shield for the weakest allied hero equal to 400% of the Radiant Angel's ATK, lasting for 6s",
      },
      {
        kind: "battle",
        name: "Judgement",
        unlockStars: 2,
        iconUrl: talent("radiant-angel", "judgement"),
        description:
          "Basic ATK have a 20% chance to inflict Magic DMG equal to 150% of ATK on the target and reduce the target's Physical and Magic DMG Reduction by 10% for 8s",
      },
      {
        kind: "enhance",
        name: "Enhance Protection",
        unlockStars: 5,
        iconUrl: talent("radiant-angel", "enhance-protection"),
        description: "Holy Light Protection Shield effect increased by 100%",
      },
      {
        kind: "special",
        name: "Holy Light Shines",
        unlockStars: 8,
        iconUrl: talent("radiant-angel", "holy-light-shines"),
        description:
          "At set intervals, restore HP to the weakest allied hero equivalent to 150% of the Radiant Angel's ATK",
      },
      {
        kind: "attribute",
        name: "Holy Soul",
        unlockStars: 12,
        iconUrl: talent("radiant-angel", "holy-soul"),
        description: "ATK increased by 10%, Knockback Effect increased by 15%",
      },
      {
        kind: "enhance",
        name: "Super Protection",
        unlockStars: 16,
        iconUrl: talent("radiant-angel", "super-protection"),
        description:
          "Holy Light Protection Increases the shield effect by 125%, and restores 2.5% of Max HP per second during the shield duration.",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Holy Light Protection",
        description: "「Holy Light Protection」 duration increased by 1(3) s",
      },
      {
        name: "Tome of Radiance",
        skill: "Judgement",
        description:
          "「Judgement」 inflicts additional Magic DMG equal to 100%(300%) of Attack",
      },
      {
        name: "Luminous Visor",
        skill: "Holy Light Shines",
        description:
          "「Holy Light Shines」 additionally restores HP equal to 50%(150%) of Attack",
      },
      {
        name: "Resonance Pendant",
        skill: "Super Protection",
        description:
          "「Super Protection」 additionally restores 0.5%(1.5%) of Max HP per second",
      },
    ],
    divinities: ["support-atk", "knockback-resist"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 10.00.22 AM.png, 10.00.15 AM.png, 10.00.16 AM.png, 10.00.18 AM 1.png, 10.00.18 AM.png, 10.00.21 AM.png.
  // Talent/core continuations: 10.00.15 AM 1.png, 10.00.23 AM.png.
  // Artifact tab: 10.00.25 AM.png; abilities: 10.00.26 AM.png.
  diva: {
    artifact: {
      name: "Crystal Necklace",
      iconUrl: "/artifacts/diva.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Full-out Merrying",
          description: '"Full-out Merrying" Now activates every 12s.',
        },
        {
          tier: "gold",
          skill: "Protagonist Arrive",
          description:
            '"Protagonist Arrive" Increases Max HP Recovery by 5%, and during the duration, increases the Knockback Resist of all heroes by 25%.',
        },
        {
          tier: "red",
          skill: "Full-out Merrying",
          description:
            '"Full-out Merrying" Restores 2.5% of Max HP per second to all heroes during its duration',
        },
        {
          tier: "rainbow",
          skill: "Protagonist Arrive",
          description:
            '"Protagonist Arrive" When in effect, increases the Anti-Control Rate by 30% and Control RES by 30%.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Protagonist Arrive",
        unlockStars: 0,
        iconUrl: talent("diva", "protagonist-arrive"),
        description:
          "Sets up a magnificent stage. Within 5s, increases all allied heroes' DMG Reduction by 10%, and restores HP equal to 10% of the Diva's Max HP",
      },
      {
        kind: "special",
        name: "Full-out Merrying",
        unlockStars: 2,
        iconUrl: talent("diva", "full-out-merrying"),
        description:
          "Upon entering the battlefield, at the 10/25/45/70 second, a Melody is played, increasing all allied heroes' MOV SPD by 30% and ATK SPD by 10%, with the effect lasting for 4s.",
      },
      {
        kind: "enhance",
        name: "Enhance Stage",
        unlockStars: 5,
        iconUrl: talent("diva", "enhance-stage"),
        description: "Protagonist Arrive Increases Max HP Recovery by 5%.",
      },
      {
        kind: "enhance",
        name: "Revisit",
        unlockStars: 8,
        iconUrl: talent("diva", "revisit"),
        description: '"Full-out Merrying" Increases duration by 2s',
      },
      {
        kind: "attribute",
        name: "Excited",
        unlockStars: 12,
        iconUrl: talent("diva", "excited"),
        description: "Energy Regen SPD increased by 15%, HP increased by 10%",
      },
      {
        kind: "enhance",
        name: "Plot Armor",
        unlockStars: 16,
        iconUrl: talent("diva", "plot-armor"),
        description:
          "Protagonist Arrive Increases Max HP Recovery by 5%. Allied heroes with HP below 35% will receive an additional 50% increase in healing effects.",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Protagonist Arrive",
        description:
          "「Protagonist Arrive」 DMG Reduction increased by 2%(6%), additionally restores 2%(6%) of the Diva's max HP.",
      },
      {
        name: "Tome of Radiance",
        skill: "Full-out Merrying",
        description:
          "「Full-out Merrying」 additionally increases ATK SPD by 10%(30%).",
      },
      {
        name: "Luminous Visor",
        skill: "Revisit",
        description:
          "「Revisit」 duration additionally increased by 0.5(1.5) s.",
      },
      {
        name: "Resonance Pendant",
        skill: "Plot Armor",
        description:
          "「Plot Armor」 triggers additional Healing Effect when HP falls below 40%(50%).",
      },
    ],
    divinities: ["hp", "healing-effect"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 10.00.42 AM.png, 10.00.30 AM.png, 10.00.33 AM.png, 10.00.34 AM.png, 10.00.39 AM.png, 10.00.40 AM.png.
  // Artifact tab: 10.00.45 AM.png; abilities: 10.00.46 AM.png.
  "little-deer": {
    artifact: {
      name: "Ironskin Staff",
      iconUrl: "/artifacts/little-deer.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Poisoned Spear",
          description: '"Poisoned Spear" Increase Knockback Effect by 30%',
        },
        {
          tier: "gold",
          skill: "Nourishment",
          description:
            '"Nourishment" Turns Slow Recovery effects to Immediate Recovery effects',
        },
        {
          tier: "red",
          skill: "Awaken",
          description:
            '"Awaken" When in effect, increases all allied heroes’ DMG Reduction by 12%',
        },
        {
          tier: "rainbow",
          name: "Divine Light Shelter",
          description:
            "Reduces the DMG Result taken by all allied heroes by 10%",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Awaken",
        unlockStars: 0,
        iconUrl: talent("little-deer", "awaken"),
        description:
          "Summon the power of nature to continuously restore HP equal to 15% of Little Deer's Max HP to all allied heroes over 5s",
      },
      {
        kind: "battle",
        name: "Poisoned Spear",
        unlockStars: 2,
        iconUrl: talent("little-deer", "poisoned-spear"),
        description:
          "Basic ATK will reduce the target's MOV SPD by 50%, effect duration 3s",
      },
      {
        kind: "enhance",
        name: "Purify",
        unlockStars: 5,
        iconUrl: talent("little-deer", "purify"),
        description:
          "Awaken When healing an allied target, immediately remove certain debuffs from the target and recovers Max HP by 5%",
      },
      {
        kind: "special",
        name: "Nourishment",
        unlockStars: 8,
        iconUrl: talent("little-deer", "nourishment"),
        description:
          "At set intervals, slowly restore health to the weakest allied hero equivalent to 15% of Little Deer's Max HP.",
      },
      {
        kind: "attribute",
        name: "Assist",
        unlockStars: 12,
        iconUrl: talent("little-deer", "assist"),
        description: "Increase healing effect by 25%",
      },
      {
        kind: "enhance",
        name: "Cleanse",
        unlockStars: 16,
        iconUrl: talent("little-deer", "cleanse"),
        description:
          "Awaken Increases recovery effects by 25%. When the current HP exceeds Max HP, 50% will be converted to a shield (will not exceed the Max HP of the healed target)",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Awaken",
        description:
          "「Awaken」 additionally restores HP equal to 3%(9%) of Little Deer's Max HP",
      },
      {
        name: "Tome of Radiance",
        skill: "Poisoned Spear",
        description:
          "「Poisoned Spear」 increases the slow duration by 0.5(1.5) s",
      },
      {
        name: "Luminous Visor",
        skill: "Nourishment",
        description: "「Nourishment」 increases HP restored by 30%(100%)",
      },
      {
        name: "Resonance Pendant",
        skill: "Cleanse",
        description: "「Cleanse」 increases Shield conversion rate by 10%(30%)",
      },
    ],
    divinities: ["hp", "melee-dmg-reduction"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 10.01.16 AM 1.png, 10.01.07 AM 1.png, 10.01.09 AM.png, 10.01.10 AM.png, 10.01.12 AM.png, 10.01.13 AM.png.
  // Talent/core continuations: 10.01.07 AM.png, 10.01.11 AM.png, 10.01.16 AM.png.
  // Artifact tab: 10.01.19 AM.png; abilities: 10.01.21 AM 1.png, 10.01.21 AM.png.
  lucifer: {
    artifact: {
      name: "Blood Demon Crystal",
      iconUrl: "/artifacts/lucifer.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Flame Blade",
          description:
            "\"Flame Blade\" The enemy hit will additionally lost 1.5%'s maximum HP (capped at Lucifer's 200% ATK)",
        },
        {
          tier: "gold",
          skill: "Demon Fire",
          description:
            'The Physical DMG caused by "Demon Fire" is increased by 10%, and the Ranged DMG Reduct is increased by 15% when skill taking effect',
        },
        {
          tier: "red",
          skill: "Doomsday Curse",
          description:
            'The duration of "Doomsday Curse" is increased by 3 seconds, and the effect cannot be dispelled',
        },
        {
          tier: "rainbow",
          skill: "Demon Fire",
          description:
            '"Demon Fire" The effect lasts until the end of the battle, and 100% of the DMG caused is converted into self HP. Enemies affected by fire will have their DEF reduced by 8%',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Doomsday Curse",
        unlockStars: 0,
        iconUrl: talent("lucifer", "doomsday-curse"),
        description:
          "Releases a doomsday curse on a random enemy hero, removes all its skills for 7s (cannot release any skills), and causes 100% Physical DMG per second",
      },
      {
        kind: "battle",
        name: "Flame Blade",
        unlockStars: 2,
        iconUrl: talent("lucifer", "flame-blade"),
        description:
          "Basic ATKs have a 20% chance of wielding the Flame Blade, causing Physical DMG equal to 150% of ATK to enemies within the range, with stun effect of 2s",
      },
      {
        kind: "enhance",
        name: "Strengthen Curse",
        unlockStars: 5,
        iconUrl: talent("lucifer", "strengthen-curse"),
        description:
          "Doomsday Curse will reduce the healing effect received by the target by 40%",
      },
      {
        kind: "special",
        name: "Demon Fire",
        unlockStars: 8,
        iconUrl: talent("lucifer", "demon-fire"),
        description:
          "After entering the battlefield, it sets the surrounding land on fire to deal Physical DMG equal to 35% of ATK to surrounding enemies for every 0.5s, lasting 30s",
      },
      {
        kind: "attribute",
        name: "Demonic Contract",
        unlockStars: 12,
        iconUrl: talent("lucifer", "demonic-contract"),
        description: "DEF increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Hatred Deepens",
        unlockStars: 16,
        iconUrl: talent("lucifer", "hatred-deepens"),
        description:
          "Doomsday Curse will reduce the target's Energy Regen SPD by 50%, and the damage caused will become True DMG (ignoring the target's DEF and DMG Reduction RES)",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Doomsday Curse",
        description:
          "「Doomsday Curse」 inflicts Physical DMG each second equal to 20%(60%) of Attack.",
      },
      {
        name: "Cavalier Helm",
        skill: "Flame Blade",
        description:
          "「Flame Blade」 activation chance raised by 5%(15%), dealing Physical DMG equal to 50%(150%) of Attack.",
      },
      {
        name: "Brawler's Armor",
        skill: "Strengthen Curse",
        description:
          "「Strengthen Curse」 additionally reduces the target's Physical RES by 10%(30%).",
      },
      {
        name: "Brawler's Boots",
        skill: "Demon Fire",
        description: "「Demon Fire」 flame range expanded by 15%(45%).",
      },
    ],
    divinities: ["spd-reduction-res", "physical-res"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 10.01.35 AM.png, 10.01.27 AM.png, 10.01.28 AM.png, 10.01.29 AM.png, 10.01.32 AM.png, 10.01.33 AM.png.
  // Talent/core continuations: 10.01.30 AM.png, 10.01.35 AM 1.png.
  // Artifact tab: 10.01.37 AM.png; abilities: 10.01.38 AM.png, 10.01.39 AM.png.
  "captain-pilot": {
    artifact: {
      name: "Energy Spring",
      iconUrl: "/artifacts/captain-pilot.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Molotov Cocktail",
          description:
            '"Molotov Cocktail" Deals the same DMG and effects to targets in a small area',
        },
        {
          tier: "gold",
          skill: "Suppressive Shoot",
          description:
            '"Suppressive Shooting" Releases immediately upon entering the battlefield, then releases once per 16s, each bullet dealing 20% Physical DMG.',
        },
        {
          tier: "red",
          skill: "Warrior Strike",
          description:
            '"Warrior Strike" Upon releasing 2 nuclear bomb at enemies, the second nuclear bomb will deal Physical DMG equal to 300% of ATK to enemies',
        },
        {
          tier: "rainbow",
          name: "Armor PEN Bullet",
          description:
            "Basic ATK has a 35% chance to shoot an additional Armor PEN Bullet, piercing all enemies and dealing Physical DMG equal to 150% of ATK",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Warrior Strike",
        unlockStars: 0,
        iconUrl: talent("captain-pilot", "warrior-strike"),
        description:
          "Use a nuclear bomb to attack the enemy with the lowest DEF, dealing Physical DMG equal to 450% of ATK to all enemies in the area and stunning them for 1s",
      },
      {
        kind: "battle",
        name: "Molotov Cocktail",
        unlockStars: 2,
        iconUrl: talent("captain-pilot", "molotov-cocktail"),
        description:
          "Launch a Molotov Cocktail to a single target every 8s, dealing 150% ATK as True DMG and causing a Knockback Effect",
      },
      {
        kind: "enhance",
        name: "Enhance Bullet",
        unlockStars: 5,
        iconUrl: talent("captain-pilot", "enhance-bullet"),
        description: "Warrior Strike Increases the range of DMG dealt by 20%",
      },
      {
        kind: "special",
        name: "Suppressive Shoot",
        unlockStars: 8,
        iconUrl: talent("captain-pilot", "suppressive-shoot"),
        description:
          "Upon entering the battlefield, continuously shoot enemies for 3s, firing 5 bullets per second, each dealing Physical DMG equal to 20% of ATK to the target",
      },
      {
        kind: "attribute",
        name: "Weakness Break",
        unlockStars: 12,
        iconUrl: talent("captain-pilot", "weakness-break"),
        description: "Increase Armor PEN by 15%, and CRIT Rate by 10%",
      },
      {
        kind: "enhance",
        name: "Explosive Bullet",
        unlockStars: 16,
        iconUrl: talent("captain-pilot", "explosive-bullet"),
        description:
          "Warrior Strike Increases the Physical DMG dealt by 150% and extends the stun duration by 2s.",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Warrior Strike",
        description:
          "「Warrior Strike」 increases 60%(180%) of Attack's Physical DMG",
      },
      {
        name: "Arrow Core",
        skill: "Molotov Cocktail",
        description:
          "「Molotov Cocktail」 increases 50%(150%) of Attack's True DMG",
      },
      {
        name: "Hunter's Cloak",
        skill: "Suppressive Shoot",
        description:
          "「Suppressive Shoot」 increases 20%(60%) of Attack's Physical DMG",
      },
      {
        name: "Crystal Pendant",
        skill: "Explosive Bullet",
        description:
          "「Explosive Bullet」 increases 60%(180%) of Attack's Physical DMG",
      },
    ],
    divinities: ["crit-damage", "ranged-dmg-reduction"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 10.01.50 AM.png, 10.01.42 AM.png, 10.01.44 AM.png, 10.01.45 AM.png, 10.01.46 AM.png, 10.01.48 AM.png.
  // Talent/core continuations: 10.01.51 AM.png.
  // Artifact tab: 10.01.53 AM.png; abilities: 10.01.54 AM.png, 10.01.55 AM.png.
  "li-bai": {
    artifact: {
      name: "Lotus Nectar",
      iconUrl: "/artifacts/li-bai.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Twin Swords",
          description:
            '"Twin Swords" Each flying sword will randomly deal 1 to 1.5 times DMG to enemies',
        },
        {
          tier: "gold",
          skill: "Sword Beam",
          description:
            '"Sword Beam" Increases physical DMG by 200%. Each time the sword beam hits an enemy, restores 50 energy points',
        },
        {
          tier: "red",
          skill: "Sky-Splitting Sword",
          description:
            "[Sky-Splitting Sword]: Each flying sword inflicts bonus damage equal to 4% of the target's Max HP (up to a maximum of 100% of Li Bai's Attack). Additionally, the user's Attack Speed is increased by 30% for 6 seconds after activation.",
        },
        {
          tier: "rainbow",
          name: "Hero's Journey",
          description:
            "Increases self ATK by 6% for 6s after a Basic ATK or skill release (up to a maximum of 4 stacks).\nPassive: When taking single DMG exceeding 15% of max HP, restores 100 energy points (Cooldown: 2s)",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Sky-Splitting Sword",
        unlockStars: 0,
        iconUrl: talent("li-bai", "sky-splitting-sword"),
        description:
          "Unleashes 5 flying swords forward, each dealing Physical DMG equal to 125% of ATK to enemy targets. It has a chance to trigger a piercing effect, causing the same DMG and effects to multiple targets\nEffect 1: 30% chance to attack 2 targets in front.\nEffect 2: 15% chance to attack 3 targets in front",
      },
      {
        kind: "battle",
        name: "Twin Swords",
        unlockStars: 2,
        iconUrl: talent("li-bai", "twin-swords"),
        description:
          "Basic ATK release 2 flying swords, each dealing Physical DMG equal to 110% of ATK to the target",
      },
      {
        kind: "enhance",
        name: "Sword Breaker",
        unlockStars: 5,
        iconUrl: talent("li-bai", "sword-breaker"),
        description:
          "Sky-Splitting Sword increases the DMG of each flying sword by 25% and grants an additional 30% Armor PEN",
      },
      {
        kind: "special",
        name: "Sword Beam",
        unlockStars: 8,
        iconUrl: talent("li-bai", "sword-beam"),
        description:
          "Every 3 attacks, unlease a sword beam to attack enemies in front, dealing Physical DMG equal to 3% of ATK. Enemies hit by the sword beam will lose 50 energy",
      },
      {
        kind: "attribute",
        name: "Lotus Sword",
        unlockStars: 12,
        iconUrl: talent("li-bai", "lotus-sword"),
        description: "ATK increased by 15%, Knockback Effect increased by 10%",
      },
      {
        kind: "enhance",
        name: "Man and Sword",
        unlockStars: 16,
        iconUrl: talent("li-bai", "man-and-sword"),
        description:
          "Sky-Splitting Sword Flying swords +1. Convert 30% of DMG of Twin Swords and Sword Beam into HP",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Sky-Splitting Sword",
        description:
          "「Sky-Splitting Sword」 each flying sword deals bonus Physical DMG equal to 16%(48%) of ATK.",
      },
      {
        name: "Arrow Core",
        skill: "Twin Swords",
        description:
          "「Twin Swords」 Each flying sword has a 30%(90%) chance to pierce through a target, dealing equal DMG and effects.",
      },
      {
        name: "Hunter's Cloak",
        skill: "Sword Beam",
        description: "「Sword Beam」 Additionally consumes 15(45) less energy.",
      },
      {
        name: "Crystal Pendant",
        skill: "Man and Sword",
        description:
          "「Man and Sword」 Increases the HP conversion ratio by 15%(45%).",
      },
    ],
    divinities: ["physical-res", "ranged-dmg-reduction"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 10.02.07 AM.png, 10.02.00 AM.png, 10.02.02 AM.png, 10.02.03 AM.png, 10.02.05 AM.png, 10.02.06 AM.png.
  // Talent/core continuations: 10.02.01 AM.png, 10.02.04 AM.png.
  // Artifact tab: 10.02.09 AM.png; abilities: 10.02.10 AM.png, 10.02.11 AM.png.
  "lady-pan": {
    artifact: {
      name: "Nonstick Pan",
      iconUrl: "/artifacts/lady-pan.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Home Delivery",
          description:
            '"Home Delivery" Increase the Magic DMG dealt upon impacting enemies by 35%',
        },
        {
          tier: "gold",
          skill: "Home Delivery",
          description:
            '"Home Delivery" Reduces the intervals of release by 25%',
        },
        {
          tier: "red",
          skill: "Deluxe Cake",
          description:
            '"Deluxe Cake" The success chance of preparation increased to 20%. The duration extended by 2s',
        },
        {
          tier: "rainbow",
          name: "Random Snack",
          description:
            "Basic ATK have a 40% chance to throw a small snack to the weakest ally, restoring HP equal to 180% of their ATK and applying a random buff:\nCustard Tart: Increases ATK SPD and MOV SPD by 25% for 5s\nCake: Increases ATK by 25% for 5s\nBurger: Increases DEF by 25% for 5s",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Cutlery Throw",
        unlockStars: 0,
        iconUrl: talent("lady-pan", "cutlery-throw"),
        description:
          "Randomly throw 3~6 different pieces of cutlery at enemies. Each piece deals Magic DMG equal to 90% of ATK and additional effects:\nPlate: Increases Knockback Effect by 30%\nPan: Stuns for 1.5s\nFork: Reduces target's DEF by 12% for 5s (stackable)",
      },
      {
        kind: "special",
        name: "Home Delivery",
        unlockStars: 2,
        iconUrl: talent("lady-pan", "home-delivery"),
        description:
          "In a set interval, mount the beloved motorcycle and charge forward, dealing Magic DMG equal to 100% of ATK to the all enemies in path. The impacted enemies will suffer from different debuffs:\nEffect 1: Reduced ATK by 10% for 5s\nEffect 2: Reduced MOV SPD by 20% for 3s\nEffect 3: Stunned for 1.5s",
      },
      {
        kind: "enhance",
        name: "Precise Throw",
        unlockStars: 5,
        iconUrl: talent("lady-pan", "precise-throw"),
        description: "Cutlery Throw Magic DMG of each piece increased by 40%",
      },
      {
        kind: "special",
        name: "Deluxe Cake",
        unlockStars: 8,
        iconUrl: talent("lady-pan", "deluxe-cake"),
        description:
          "In a set interval, place a deluxe cake in the middle of the battlefield. The outcome of the preparation determines the effects:\nSuccess: Restores 3.5% of allies' Max HP per second and increases Energy Regen SPD by 8% per second. Additionally, grants allies 10% DMG Reduction for 4s\nFail: Restores 2.5% of allies' Max HP per second and increases allies' DEF by 20% for 3s",
      },
      {
        kind: "attribute",
        name: "Culinary Mastery",
        unlockStars: 12,
        iconUrl: talent("lady-pan", "culinary-mastery"),
        description: "ATK increased by 15%, HP increased by 10%",
      },
      {
        kind: "enhance",
        name: "Spare Cutlery",
        unlockStars: 16,
        iconUrl: talent("lady-pan", "spare-cutlery"),
        description:
          "Cutlery Throw Increases the maximum number of cutlery thrown by 6",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Cutlery Throw",
        description:
          "「Cutlery Throw」 increases Magic DMG by 20%(60%) of Attack",
      },
      {
        name: "Tome of Radiance",
        skill: "Home Delivery",
        description:
          "「Home Delivery」 increases Magic DMG by 50%(150%) of Attack",
      },
      {
        name: "Luminous Visor",
        skill: "Deluxe Cake",
        description:
          "「Deluxe Cake」 increases Max HP Regen per second by 1%(3%) upon either successful creation or Loss",
      },
      {
        name: "Resonance Pendant",
        skill: "Spare Cutlery",
        description:
          "「Spare Cutlery」 increases Cutlery Throw's maximum utensil count by 1(3)",
      },
    ],
    divinities: ["atk", "hp"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 8.35.46 AM.png, 8.35.38 AM.png, 8.35.40 AM.png, 8.35.41 AM.png, 8.35.42 AM.png, 8.35.44 AM.png.
  // Artifact tab: 8.36.27 AM.png; abilities: 8.36.29 AM.png.
  "skeleton-king": {
    artifact: {
      name: "Blade of Destruction",
      iconUrl: "/artifacts/skeleton-king.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Bloodthirsty Curse",
          description:
            '"Bloodthirsty Curse" Can be applied to all allied heroes',
        },
        {
          tier: "gold",
          skill: "Return from the Underworld",
          description:
            '"Return from the Underworld" Increases HP Recovery to 85%',
        },
        {
          tier: "red",
          skill: "Dark Soul Fireball",
          description:
            '"Dark Soul Fireball" Deals equivalent DMG and effects to targets in a small range',
        },
        {
          tier: "rainbow",
          name: "Soul Guardian",
          description:
            "For every 8s, summon a Soul Guardian to the battlefield. The Soul Guardian possesses 25% of the Skeleton King's attributes, lasting for 20s.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Dark Soul Fireball",
        unlockStars: 0,
        iconUrl: talent("skeleton-king", "dark-soul-fireball"),
        description:
          "Release a Dark Soul Fireball forward, dealing Physical DMG equal to 455% of ATK to a single target with a knockback effect. All DMG taken by the hit target within 6s will be increased by 15%",
      },
      {
        kind: "aura",
        name: "Bloodthirsty Curse",
        unlockStars: 2,
        iconUrl: talent("skeleton-king", "bloodthirsty-curse"),
        description:
          "Increase the Lifesteal effect for all Melee allies by 15%",
      },
      {
        kind: "enhance",
        name: "Hellfire Heavy Strike",
        unlockStars: 5,
        iconUrl: talent("skeleton-king", "hellfire-heavy-strike"),
        description: "Dark Soul Fireball Stuns the target for 4s",
      },
      {
        kind: "passive",
        name: "Return from the Underworld",
        unlockStars: 8,
        iconUrl: talent("skeleton-king", "return-from-the-underworld"),
        description:
          "Skeleton King survives lethal damage and restores 35% HP (triggers 1 time(s) per battle).",
      },
      {
        kind: "attribute",
        name: "Dark Soul Real Body",
        unlockStars: 12,
        iconUrl: talent("skeleton-king", "dark-soul-real-body"),
        description: "Increase DEF by 25%",
      },
      {
        kind: "enhance",
        name: "Hell King's Howl",
        unlockStars: 16,
        iconUrl: talent("skeleton-king", "hell-king-s-howl"),
        description:
          "Return from the Underworld Stuns all enemy targets for 3s. The Skeleton King will receive 25% increased DEF within 10s of resurrection.",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Dark Soul Fireball",
        description:
          "「Dark Soul Fireball」 increases all DMG taken by the target by 5% (15%)",
      },
      {
        name: "Cavalier Helm",
        skill: "Bloodthirsty Curse",
        description: "「Bloodthirsty Curse」 increases Lifesteal by 5% (15%)",
      },
      {
        name: "Brawler's Armor",
        skill: "Hellfire Heavy Strike",
        description:
          "「Hellfire Heavy Strike」 Dark Soul Fireball additionally deals True DMG equal to 100% (300%) of ATK",
      },
      {
        name: "Brawler's Boots",
        skill: "Hell King's Howl",
        description:
          "「Hell King's Howl」 increases DEF buff duration by 2 (6)s and additionally increases DEF by 10% (30%)",
      },
    ],
    divinities: ["hp", "heavy-injury"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 8.36.42 AM.png, 8.36.33 AM.png, 8.36.35 AM.png, 8.36.37 AM.png, 8.36.39 AM.png, 8.36.41 AM.png.
  // Artifact tab: 8.36.44 AM.png; abilities: 8.36.47 AM.png.
  // Core continuations: 8.36.34 AM.png, 8.36.38 AM.png.
  "whirlpool-ninja": {
    artifact: {
      name: "Whirlwind Meteor",
      iconUrl: "/artifacts/whirlpool-ninja.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Cloning Technique",
          description:
            '"Clone" Decreases the DMG received by the clone by 150%',
        },
        {
          tier: "gold",
          skill: "Unyielding",
          description:
            '"Unyielding" When triggered, immediately knocks surrounding enemies back, and increases DMG Reduction by 15% within 6s',
        },
        {
          tier: "red",
          skill: "Energy Vortex",
          description:
            '"Energy Vortex" Increases the Physical DMG dealt by 100%, with 3s of Stun effect',
        },
        {
          tier: "rainbow",
          skill: "Cloning Technique",
          description:
            '"Clone" When the clone receives lethal DMG, it will release Silence Balls, dealing Physical DMG equal to 200% of ATK to surrounding targets, silencing them for 4s',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Energy Vortex",
        unlockStars: 0,
        iconUrl: talent("whirlpool-ninja", "energy-vortex"),
        description:
          "Launch a vortex ball forward to deal Physical DMG equal to 400% of ATK to targets in range and prevent them from recovering Energy for 3s",
      },
      {
        kind: "special",
        name: "Cloning Technique",
        unlockStars: 2,
        iconUrl: talent("whirlpool-ninja", "cloning-technique"),
        description:
          "Upon entering the battlefield, summon a clone that takes 400% of the DMG (can only be triggered 1 time(s) per battle)",
      },
      {
        kind: "enhance",
        name: "Enhance Vortex",
        unlockStars: 5,
        iconUrl: talent("whirlpool-ninja", "enhance-vortex"),
        description: "Energy Vortex Increases Physical DMG dealt by 125%",
      },
      {
        kind: "passive",
        name: "Unyielding",
        unlockStars: 8,
        iconUrl: talent("whirlpool-ninja", "unyielding"),
        description:
          "When the HP falls below 35%, remove all debuffs and immediately restore 100% energy (can only be triggered 1 time(s) per battle)",
      },
      {
        kind: "attribute",
        name: "Ninjutsu",
        unlockStars: 12,
        iconUrl: talent("whirlpool-ninja", "ninjutsu"),
        description: "Increase DEF by 25%",
      },
      {
        kind: "enhance",
        name: "Super Charge",
        unlockStars: 16,
        iconUrl: talent("whirlpool-ninja", "super-charge"),
        description:
          "Energy Vortex Increases DMG Range by 25%, the target hit will be unable to recover Energy for an additional 1s",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Energy Vortex",
        description:
          "「Energy Vortex」 increases Physical DMG by 50% (150%) of ATK",
      },
      {
        name: "Cavalier Helm",
        skill: "Cloning Technique",
        description:
          "「Cloning Technique」 reduces DMG taken by clones by 80% (250%)",
      },
      {
        name: "Brawler's Armor",
        skill: "Unyielding",
        description:
          "「Unyielding」 additionally increases own DEF by 10% (30%) for 10s",
      },
      {
        name: "Brawler's Boots",
        skill: "Super Charge",
        description:
          "「Super Charge」 additionally increases DMG range by 5% (15%)",
      },
    ],
    divinities: ["hp", "crit-damage"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 8.37.00 AM.png, 8.36.53 AM.png, 8.36.55 AM.png, 8.36.56 AM.png, 8.36.57 AM.png, 8.36.59 AM.png.
  // Artifact tab: 8.37.03 AM.png; abilities: 8.37.04 AM.png, 8.37.05 AM.png.
  // Core continuations: 8.36.54 AM.png.
  "foxy-spirit": {
    artifact: {
      name: "Exquisite Lamp",
      iconUrl: "/artifacts/foxy-spirit.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Soul Snatcher Orb",
          description:
            '"Soul Snatcher Orb" Each time the orb hits an enemy, permanently increases self ATK by 10% (up to 3 stacks)',
        },
        {
          tier: "gold",
          skill: "Mind's Mirror",
          description:
            '"Mind\'s Eye Mirror" At the end of its duration, stuns enemies for an additional 2.5s',
        },
        {
          tier: "red",
          name: "Foxfire Raid",
          description:
            "Upon entering combat, immediately releases 4 foxfire to attack enemies. Each fire deals Magic DMG equal to 160% of ATK and significantly knocks back enemies. Passive: In the first 25s in combat, increases ATK SPD by 45% and ATK by 20%",
        },
        {
          tier: "rainbow",
          name: "Soul Rend",
          description:
            "Reduces all enemies' Magic DMG Boost by 15% upon entering battle. When Nightfire and Soul Snatcher Orb deal damage to enemies, converts 21% of the damage dealt into self HP",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Nightfire",
        unlockStars: 0,
        iconUrl: talent("foxy-spirit", "nightfire"),
        description:
          "Unleashes 5 foxfire to attack enemies. Each deals 160% Magic DMG to its target. The foxfire will prioritize attacking the melee enemy with the lowest HP",
      },
      {
        kind: "battle",
        name: "Soul Snatcher Orb",
        unlockStars: 2,
        iconUrl: talent("foxy-spirit", "soul-snatcher-orb"),
        description:
          "Basic ATKs have a 50% chance to launch a Soul Snatcher Orb, dealing Magic DMG equal to 100% of ATK +150% True DMG to enemies and significantly knocking them back",
      },
      {
        kind: "enhance",
        name: "Spell Surge",
        unlockStars: 5,
        iconUrl: talent("foxy-spirit", "spell-surge"),
        description:
          "Nightfire Each foxfire randomly deals DMG ranging from 0.9 to 1.3 times the base damage",
      },
      {
        kind: "special",
        name: "Mind's Mirror",
        unlockStars: 8,
        iconUrl: talent("foxy-spirit", "mind-s-mirror"),
        description:
          "Every 10s, debuffs the enemy with the highest ATK for 5s, reducing their ATK by 20% and ATK SPD by 40%",
      },
      {
        kind: "attribute",
        name: "Heart Cleansing",
        unlockStars: 12,
        iconUrl: talent("foxy-spirit", "heart-cleansing"),
        description: "ATK increased by 15%, CRIT Rate increased by 10%",
      },
      {
        kind: "enhance",
        name: "Fox Fire",
        unlockStars: 16,
        iconUrl: talent("foxy-spirit", "fox-fire"),
        description:
          "Nightfire requires 15% less energy to cast, and the number of foxfire released +1",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Nightfire",
        description:
          "「Nightfire」 each foxfire now also deals DMG equal to 1.2%(3.6%) of the target's max HP (capped at 20%(60%) of the Foxy Spirit's ATK)",
      },
      {
        name: "Arcane Hat",
        skill: "Soul Snatcher Orb",
        description:
          "「Soul Snatcher Orb」 inflicts additional True DMG equal to 50%(150%) of ATK",
      },
      {
        name: "Mage Robe",
        skill: "Spell Surge",
        description:
          "「Spell Surge」 DMG multiplier's upper and lower limits each increase by 0.1(0.3) times",
      },
      {
        name: "Spell Tome",
        skill: "Mind's Mirror",
        description: "「Mind's Mirror」 cast interval reduced by 1(3)s",
      },
    ],
    divinities: ["magic-res", "crit-damage"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 8.38.29 AM.png, 8.37.09 AM.png, 8.37.11 AM.png, 8.37.12 AM.png, 8.37.16 AM.png, 8.38.06 AM.png.
  // Artifact tab: 8.38.58 AM.png; abilities: 8.38.59 AM.png.
  // Core continuations: 8.38.30 AM.png, 8.37.10 AM.png.
  loli: {
    artifact: {
      name: "Gatling",
      iconUrl: "/artifacts/loli.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Explosive Flying Bullet",
          description:
            '"Explosive Flying Bullet" Increases the Physical DMG dealt by the explosion by 50%',
        },
        {
          tier: "gold",
          skill: "Explosive Strike",
          description:
            '"Explosive Strike" Decreases the Physical RES of the first target hit by the flying bullet by 15% within 5s',
        },
        {
          tier: "red",
          skill: "Super Bullet",
          description:
            '"Super Bullet" After the flying bullet hits the first target, it will cause an explosion, dealing Physical DMG equal to 350% of ATK to targets in range',
        },
        {
          tier: "rainbow",
          name: "Extreme Excitement",
          description:
            "When HP is higher than 65%, increase the CRIT Rate by 20% and ATK SPD by 20%",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Super Bullet",
        unlockStars: 0,
        iconUrl: talent("loli", "super-bullet"),
        description:
          "Launches a missile forward that strikes a single target, dealing 480% of Attack as Physical DMG, interrupting and knocking them back. The missile also deals bonus damage equal to 20% of the target's lost HP.",
      },
      {
        kind: "battle",
        name: "Explosive Flying Bullet",
        unlockStars: 2,
        iconUrl: talent("loli", "explosive-flying-bullet"),
        description:
          "Turns Basic ATK to Explosive Flying Bullet, dealing Physical DMG equal to 110% of ATK to the target. Upon hitting the target, causes an explosion that deals 40% Physical DMG to targets within range",
      },
      {
        kind: "enhance",
        name: "Enhance Missile",
        unlockStars: 5,
        iconUrl: talent("loli", "enhance-missile"),
        description: "Super Bullet Increases Physical DMG dealt by 150%",
      },
      {
        kind: "enhance",
        name: "Explosive Strike",
        unlockStars: 8,
        iconUrl: talent("loli", "explosive-strike"),
        description:
          "Explosive Flying Bullet After hitting the first target, decreases Knockback Resist by 30% within 5s",
      },
      {
        kind: "attribute",
        name: "ATK Amplification",
        unlockStars: 12,
        iconUrl: talent("loli", "atk-amplification"),
        description: "Increases ATK by 25%",
      },
      {
        kind: "enhance",
        name: "Concussion Bullet",
        unlockStars: 16,
        iconUrl: talent("loli", "concussion-bullet"),
        description:
          "Super Bullet Increases the Knockback Effect by 30%, stunning the hit target for 3s",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Super Bullet",
        description:
          "「Super Bullet」 Increases DMG by 3% (10%) of the Target's lost HP (up to 400% (500%) of the Loli's Attack).",
      },
      {
        name: "Arrow Core",
        skill: "Explosive Flying Bullet",
        description:
          "「Explosive Flying Bullet」 Inflicts additional Physical DMG equal to 50% (150%) of Attack to the primary Target.",
      },
      {
        name: "Hunter's Cloak",
        skill: "Enhance Missile",
        description:
          "「Enhance Missile」 Inflicts additional Physical DMG equal to 50%(150%) of Attack.",
      },
      {
        name: "Crystal Pendant",
        skill: "Explosive Strike",
        description:
          "「Explosive Strike」 additionally reduces the Target's Knockback Resist by 5% (15%)",
      },
    ],
    divinities: ["marksman-def", "crit-damage"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 8.39.13 AM.png, 8.39.05 AM.png, 8.39.08 AM.png, 8.39.09 AM.png, 8.39.10 AM.png, 8.39.12 AM.png.
  // Artifact tab: 8.39.16 AM.png; abilities: 8.39.17 AM.png.
  // Core continuations: 8.39.07 AM.png.
  "googoo-fish": {
    artifact: {
      name: "Dragon Scale",
      iconUrl: "/artifacts/googoo-fish.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Steal",
          description:
            '100% of the ATK stolen through "Steal" will be transferred to self.',
        },
        {
          tier: "gold",
          skill: "Sudden Assault",
          description: 'Increases DEF stolen through "Sudden Assault" by 10%',
        },
        {
          tier: "red",
          skill: "Steal",
          description:
            'Extend the duration of the "Steal" until the end of the battle',
        },
        {
          tier: "rainbow",
          skill: "Aqua Dance",
          description:
            'During "Aqua Dance", HP Recovery per second will be increased by 2.4%',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Aqua Dance",
        unlockStars: 0,
        iconUrl: talent("googoo-fish", "aqua-dance"),
        description:
          "Create an Aqua Shield to protect yourself, restoring 3% Max HP per second, lasting for 6s.",
      },
      {
        kind: "battle",
        name: "Steal",
        unlockStars: 2,
        iconUrl: talent("googoo-fish", "steal"),
        description:
          "Attack to steal 10% of the target's ATK and transfer 50% to self, lasting for 10s (can only trigger once per target, up to a max of 100% of GooGoo Fish's ATK)",
      },
      {
        kind: "enhance",
        name: "Water Burst",
        unlockStars: 5,
        iconUrl: talent("googoo-fish", "water-burst"),
        description:
          "Aqua Dance Causes an explosion at the end of skill, dealing Physical DMG equal to 300% of ATK to surrounding enemies",
      },
      {
        kind: "special",
        name: "Sudden Assault",
        unlockStars: 8,
        iconUrl: talent("googoo-fish", "sudden-assault"),
        description:
          "Upon entering the battlefield, steal 20% of DEF from the enemy with the highest DEF, transferring 100% to self until the battle ends (up to a max of 100% of GooGoo Fish's DEF)",
      },
      {
        kind: "attribute",
        name: "Contract",
        unlockStars: 12,
        iconUrl: talent("googoo-fish", "contract"),
        description: "ATK increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Dark Shadow",
        unlockStars: 16,
        iconUrl: talent("googoo-fish", "dark-shadow"),
        description: "During Aqua Dance, grants 15% EVA to GooGoo Fish",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Aqua Dance",
        description:
          "[Aqua Dance]: Recovers an additional 0.5% (1.5%) of Max HP every second.",
      },
      {
        name: "Cavalier Helm",
        skill: "Steal",
        description:
          "「Steal」 additionally steals 3% (10%) of the target's ATK (up to 130% (200%) of GooGoo Fish's ATK)",
      },
      {
        name: "Brawler's Armor",
        skill: "Water Burst",
        description:
          "「Water Burst」 increases Physical DMG by 100% (300%) of ATK",
      },
      {
        name: "Brawler's Boots",
        skill: "Sudden Assault",
        description:
          "「Sudden Assault」 additionally steals 5% (15%) of the target's DEF",
      },
    ],
    divinities: ["atk", "crit-damage"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 8.39.36 AM.png, 8.39.22 AM.png, 8.39.23 AM.png, 8.39.31 AM.png, 8.39.33 AM.png, 8.39.35 AM.png.
  // Artifact tab: 8.39.38 AM.png; abilities: 8.39.40 AM.png, 8.40.40 AM.png.
  "moon-goddess": {
    artifact: {
      name: "Merciless Crossbow",
      iconUrl: "/artifacts/moon-goddess.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Moon Goddess's Arrow",
          description:
            '"Moon Goddess\'s Arrow" Increases the ATK SPD by 50% within 2s upon triggering',
        },
        {
          tier: "gold",
          skill: "Encourage",
          description: '"Encourage" Extends effect duration by 100%',
        },
        {
          tier: "red",
          skill: "Meteor Shower",
          description:
            '"Meteor Shower" Upon release, summons an enhanced meteor that deals True DMG equal to 350% of ATK to a random target, stunning them for 3s',
        },
        {
          tier: "rainbow",
          skill: "ATK SPD Aura",
          description:
            '"ATK SPD Aura" Increases ATK SPD by 10% and Ranged DMG by 15%.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Meteor Shower",
        unlockStars: 0,
        iconUrl: talent("moon-goddess", "meteor-shower"),
        description:
          "Summon a meteor strike on all enemies, dealing Physical DMG equal to 270% of ATK and stunning hit targets for 2s",
      },
      {
        kind: "battle",
        name: "Moon Goddess's Arrow",
        unlockStars: 2,
        iconUrl: talent("moon-goddess", "moon-goddess-s-arrow"),
        description:
          "Basic ATK has a 20% chance to shoot a Moon Goddess's Arrow at a single target, dealing Physical DMG equal to 150% of ATK and stuns for 1.5s",
      },
      {
        kind: "enhance",
        name: "Meteor Strike",
        unlockStars: 5,
        iconUrl: talent("moon-goddess", "meteor-strike"),
        description: "Meteor Shower Increases the Physical DMG dealt by 60%",
      },
      {
        kind: "special",
        name: "Encourage",
        unlockStars: 8,
        iconUrl: talent("moon-goddess", "encourage"),
        description:
          "Upon entering the battlefield, increases the ATK SPD by 20% and MOV SPD by 20% for all allied heroes. The skill effect will diminish over time.",
      },
      {
        kind: "attribute",
        name: "ATK Amplification",
        unlockStars: 12,
        iconUrl: talent("moon-goddess", "atk-amplification"),
        description: "ATK increased by 15%, Armor PEN increased by 10%",
      },
      {
        kind: "aura",
        name: "ATK SPD Aura",
        unlockStars: 16,
        iconUrl: talent("moon-goddess", "atk-spd-aura"),
        description: "Increase the ATK SPD of all Ranged allied heroes by 10%",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Meteor Shower",
        description:
          "「Meteor Shower」 increases the Stun duration by 0.5(1.5)s",
      },
      {
        name: "Arrow Core",
        skill: "Moon Goddess's Arrow",
        description:
          "「Moon Goddess's Arrow」 deals additional Physical DMG equal to 100% (300%) of your Attack",
      },
      {
        name: "Hunter's Cloak",
        skill: "Meteor Strike",
        description:
          "「Meteor Strike」 deals additional Physical DMG equal to 20%(60%) of your Attack",
      },
      {
        name: "Crystal Pendant",
        skill: "ATK SPD Aura",
        description:
          "「ATK SPD Aura」 further increases the Attack Speed of allied Ranged Heroes by 5%(15%)",
      },
    ],
    divinities: ["marksman-def", "heavy-injury"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 8.41.17 AM.png, 8.41.08 AM.png, 8.41.10 AM.png, 8.41.11 AM.png, 8.41.13 AM.png, 8.41.15 AM.png.
  // Artifact tab: 8.41.21 AM.png; abilities: 8.41.22 AM.png.
  // Core continuations: 8.41.18 AM.png, 8.41.08 AM 1.png, 8.41.12 AM.png.
  "cowboy-killer": {
    artifact: {
      name: "Desert Revolver",
      iconUrl: "/artifacts/cowboy-killer.png",
      bonuses: [
        {
          tier: "purple",
          skill: "PEN Bullet",
          description:
            '"PEN Bullet" After 1 Basic ATK, PEN Bullet will be triggered.',
        },
        {
          tier: "gold",
          skill: "Growth Favors",
          description: '"Growth Favors" Stacks +4',
        },
        {
          tier: "red",
          skill: "Barrage Bullets",
          description:
            '"Barrage Bullets" Increases the CRIT Rate of shot bullets by 40%',
        },
        {
          tier: "rainbow",
          skill: "Growth Favors",
          description:
            '"Growth Favors" When using Basic ATK or skill, stacks an additional 2.5% for ATK SPD',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Barrage Bullets",
        unlockStars: 0,
        iconUrl: talent("cowboy-killer", "barrage-bullets"),
        description:
          "Shoots 4 bullets to the front, with each bullet dealing Physical DMG equal to 100% of ATK to the front 3 target units. The Knockback Effect will decrease by 20% with every target the bullet passes through",
      },
      {
        kind: "battle",
        name: "PEN Bullet",
        unlockStars: 2,
        iconUrl: talent("cowboy-killer", "pen-bullet"),
        description:
          "Release a PEN bullet with the interrupting effect after 2 Basic ATK. It will deal Physical DMG equal to 100% of ATK to the first target and 200% Physical DMG to the second target",
      },
      {
        kind: "enhance",
        name: "Enhance Ammo",
        unlockStars: 5,
        iconUrl: talent("cowboy-killer", "enhance-ammo"),
        description:
          "Barrage Bullets Increases the Physical DMG dealt by each bullet by 20%",
      },
      {
        kind: "passive",
        name: "Growth Favors",
        unlockStars: 8,
        iconUrl: talent("cowboy-killer", "growth-favors"),
        description:
          "During Basic ATK or skill release, increase DMG Result by 3%, up to 6 stacks",
      },
      {
        kind: "attribute",
        name: "Precise",
        unlockStars: 12,
        iconUrl: talent("cowboy-killer", "precise"),
        description: "ATK increased by 10%, Armor PEN increased by 15%",
      },
      {
        kind: "enhance",
        name: "Metal Slug",
        unlockStars: 16,
        iconUrl: talent("cowboy-killer", "metal-slug"),
        description: "Barrage Bullets No. of bullets +1, Pierce count +1",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Barrage Bullets",
        description:
          "「Barrage Bullets」 Each bullet inflicts additional Physical DMG equal to 10% (30%) of Attack.",
      },
      {
        name: "Arrow Core",
        skill: "PEN Bullet",
        description:
          "「PEN Bullet」 Inflicts additional Physical DMG equal to 30%(100%) of Attack to the first Target, and additional Physical DMG equal to 60%(200%) of Attack to the second Target.",
      },
      {
        name: "Hunter's Cloak",
        skill: "Enhance Ammo",
        description:
          "「Enhance Ammo」 Each bullet inflicts additional Physical DMG equal to 10% (30%) of Attack.",
      },
      {
        name: "Crystal Pendant",
        skill: "Growth Favors",
        description:
          "「Growth Favors」 Each stack additionally increases the final DMG Result by 0.5%(1.5%).",
      },
    ],
    divinities: ["marksman-def", "physical-dmg-boost"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 9.01.18 AM.png, 9.01.11 AM.png, 9.01.12 AM.png, 9.01.14 AM.png, 9.01.16 AM.png, 9.01.17 AM.png.
  // Artifact tab: 8.42.09 AM.png; abilities: 8.42.10 AM.png.
  // Core continuations: 9.01.19 AM.png, 9.01.14 AM 1.png.
  "jungle-archer": {
    artifact: {
      name: "Forest Longbow",
      iconUrl: "/artifacts/jungle-archer.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Fiery Barrage",
          description:
            '"Fiery Barrage" Arrows have a 30% chance to stun for 1.5s.',
        },
        {
          tier: "gold",
          skill: "High Speed",
          description: '"High Speed" Extends effect duration by 50%',
        },
        {
          tier: "red",
          skill: "Gale Arrow",
          description:
            '"Gale Arrow" Increases the final DMG Result dealt by 60%',
        },
        {
          tier: "rainbow",
          skill: "High Speed",
          description: '"High Speed" Extends effect duration by 18s',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Gale Arrow",
        unlockStars: 0,
        iconUrl: talent("jungle-archer", "gale-arrow"),
        description:
          "Shoot a powerful arrow that pierces through all enemies, dealing Physical DMG equal to 360% of ATK and applying a Knockback Effect. The DMG Result and Knockback Effect dealt will diminish by 8% with each enemy hit",
      },
      {
        kind: "battle",
        name: "Fiery Barrage",
        unlockStars: 2,
        iconUrl: talent("jungle-archer", "fiery-barrage"),
        description:
          "Basic ATK have a 35% chance to shoot two arrows, each dealing Physical DMG equal to 100% of ATK to enemies",
      },
      {
        kind: "enhance",
        name: "Enhance Arrows",
        unlockStars: 5,
        iconUrl: talent("jungle-archer", "enhance-arrows"),
        description: "Gale Arrow Increases the Physical DMG dealt by 90%",
      },
      {
        kind: "special",
        name: "High Speed",
        unlockStars: 8,
        iconUrl: talent("jungle-archer", "high-speed"),
        description:
          "Upon entering the battlefield, increase MOV SPD by 30% and ATK SPD by 30%, effects lasting for 10s.",
      },
      {
        kind: "attribute",
        name: "Hunter's Lineage",
        unlockStars: 12,
        iconUrl: talent("jungle-archer", "hunter-s-lineage"),
        description: "ATK increased by 10%, Armor PEN increased by 15%",
      },
      {
        kind: "enhance",
        name: "Upgraded Arrows",
        unlockStars: 16,
        iconUrl: talent("jungle-archer", "upgraded-arrows"),
        description:
          "Gale Arrow DMG Result and Knockback Effect will no longer diminish upon hitting an enemy.",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Gale Arrow",
        description:
          "「Gale Arrow」 increases Physical DMG by 40%(120%) of Attack",
      },
      {
        name: "Arrow Core",
        skill: "Fiery Barrage",
        description:
          "「Fiery Barrage」 increases each arrow's Physical DMG by 20%(60%) of Attack",
      },
      {
        name: "Hunter's Cloak",
        skill: "Enhance Arrows",
        description:
          "「Empowered Arrows」 increases Physical DMG by 40%(120%) of Attack",
      },
      {
        name: "Crystal Pendant",
        skill: "High Speed",
        description:
          "「High Speed」 additionally increases ATK SPD and MOV SPD by 5%(15%)",
      },
    ],
    divinities: ["marksman-def", "anti-crit-rate"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 8.44.07 AM.png, 8.43.55 AM.png, 8.44.01 AM.png, 8.44.03 AM.png, 8.44.04 AM.png, 8.44.05 AM.png.
  // Artifact tab: 8.44.09 AM.png; abilities: 8.44.10 AM.png.
  // Core continuations: 8.44.07 AM 1.png, 8.43.56 AM.png.
  "white-ox": {
    artifact: {
      name: "Mountain Splitting Axe",
      iconUrl: "/artifacts/white-ox.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Heavy Strike",
          description:
            '"Heavy Strike" Increases the Physical DMG dealt by 250%',
        },
        {
          tier: "gold",
          skill: "Warrior Charge",
          description:
            '"Warrior Charge" Upon entering the battlefield, increases DEF by 20% within 25s',
        },
        {
          tier: "red",
          skill: "Brute Charge",
          description:
            '"Brute Charge" Every 14s, summon a herd of bulls to strike all enemies on the battlefield, dealing 300% True DMG and knocking them back',
        },
        {
          tier: "rainbow",
          name: "Divine Aura",
          description:
            "Increases the MOV SPD of all allied heroes by 12%, increases Control RES by 35%",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Brute Charge",
        unlockStars: 0,
        iconUrl: talent("white-ox", "brute-charge"),
        description:
          "Summon 2 bulls to crash into the enemy, and each bull will deal 700% Physical DMG to the enemy. Enemies hit by the bull will be stunned for 1s.",
      },
      {
        kind: "special",
        name: "Warrior Charge",
        unlockStars: 2,
        iconUrl: talent("white-ox", "warrior-charge"),
        description:
          "Upon entering the battlefield, charge until it hits the first enemy. The enemy that was hit will be knocked back, receiving Physical DMG equal to 100% of ATK and stunned for 2s. The hero is immune to Control effects when it is charging",
      },
      {
        kind: "battle",
        name: "Heavy Strike",
        unlockStars: 5,
        iconUrl: talent("white-ox", "heavy-strike"),
        description:
          "Basic ATK has a 30% chance to deal Physical DMG equal to 30% of ATK to the enemy",
      },
      {
        kind: "enhance",
        name: "HP Shield",
        unlockStars: 8,
        iconUrl: talent("white-ox", "hp-shield"),
        description:
          "Warrior Charge Extends stun duration by 1s, and receives a shield with 50% of Max HP when charging.",
      },
      {
        kind: "attribute",
        name: "Indomitable",
        unlockStars: 12,
        iconUrl: talent("white-ox", "indomitable"),
        description: "HP increased by 25%",
      },
      {
        kind: "enhance",
        name: "Brute Strength",
        unlockStars: 16,
        iconUrl: talent("white-ox", "brute-strength"),
        description:
          "Brute Charge Increases Knockback Effect by 50%, and increases the no. of bulls by 1.",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Brute Charge",
        description:
          "「Brute Charge」 increases Physical DMG by 170%(510%) of ATK",
      },
      {
        name: "Cavalier Helm",
        skill: "Warrior Charge",
        description:
          "「Warrior Charge」 Stun duration is increased by 0.3 (1)s, and additionally deals DMG equal to 3% (9%) of the target's Max HP (capped at 150% (450%) of White Ox's ATK)",
      },
      {
        name: "Brawler's Armor",
        skill: "HP Shield",
        description:
          "「Life Shield」 additionally grants a Shield equal to 10%(30%) of Max HP",
      },
      {
        name: "Brawler's Boots",
        skill: "Brute Strength",
        description:
          "「Brute Strength」 has a 30%(100%) chance to Summon an additional Brute Ox",
      },
    ],
    divinities: ["knockback-effect", "heavy-injury"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 8.44.20 AM.png, 8.44.14 AM.png, 8.44.16 AM.png, 8.44.17 AM.png, 8.44.18 AM.png, 8.44.19 AM.png.
  // Artifact tab: 8.44.23 AM.png; abilities: 8.44.24 AM.png.
  // Core continuations: 8.44.21 AM.png.
  "hidden-ninja": {
    artifact: {
      name: "Shuriken",
      iconUrl: "/artifacts/hidden-ninja.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Paralysis ATK",
          description:
            '"Paralysis ATK" Removes cooldown and simultaneously reduces Physical RES by 8%.',
        },
        {
          tier: "gold",
          skill: "Seal Technique",
          description:
            '"Seal Technique" Now activates once per 8s, but the duration will change to 3s',
        },
        {
          tier: "red",
          skill: "Beast Possession",
          description:
            '"Thunder Beast Possession" Increases ATK by 15% with every release up to +2 stacks',
        },
        {
          tier: "rainbow",
          skill: "Beast Pursuit",
          description:
            '"Thunder Beast Pursuit" Now deals small AoE DMG, deals the same DMG and effects to targets within range.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Beast Pursuit",
        unlockStars: 0,
        iconUrl: talent("hidden-ninja", "beast-pursuit"),
        description:
          "Release a wolf-shaped thunder beast, dealing Physical DMG equal to 600% of ATK to a single enemy target, with Interruption and Knockback Effects. Hit targets lose 80 energy per second for 3s",
      },
      {
        kind: "battle",
        name: "Paralysis ATK",
        unlockStars: 2,
        iconUrl: talent("hidden-ninja", "paralysis-atk"),
        description:
          "Basic ATK will cause the target to enter a paralysis state for 10s, reducing Magic RES by 8% (Cooldown: 5s)",
      },
      {
        kind: "enhance",
        name: "Beast Possession",
        unlockStars: 5,
        iconUrl: talent("hidden-ninja", "beast-possession"),
        description:
          "Thunder Beast Pursuit Increases Armor PEN by 8%, up to 3 stacks.",
      },
      {
        kind: "special",
        name: "Seal Technique",
        unlockStars: 8,
        iconUrl: talent("hidden-ninja", "seal-technique"),
        description:
          "Upon entering the battlefield, at 10/25/40/60s, seal an enemy with the highest ATK for 4s, stopping it from recovering Energy and limiting it to just Basic ATKs.",
      },
      {
        kind: "attribute",
        name: "Quick Regen",
        unlockStars: 12,
        iconUrl: talent("hidden-ninja", "quick-regen"),
        description: "ATK increased by 10%, Energy Regen SPD increased by 15%",
      },
      {
        kind: "enhance",
        name: "Super Beast",
        unlockStars: 16,
        iconUrl: talent("hidden-ninja", "super-beast"),
        description:
          "Thunder Beast Pursuit Turns DMG dealt to True DMG (ignores target's DEF and DMG Reduction RES)",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Beast Pursuit",
        description:
          "「Beast Pursuit」 reduces Energy Increase by 15(45) per second",
      },
      {
        name: "Arrow Core",
        skill: "Paralysis ATK",
        description:
          "「Paralysis ATK」 additionally reduces the target's Magic RES by 3%(9%)",
      },
      {
        name: "Hunter's Cloak",
        skill: "Beast Possession",
        description:
          "「Beast Possession」 additionally increases Armor PEN by 2%(6%)",
      },
      {
        name: "Crystal Pendant",
        skill: "Super Beast",
        description:
          "「Super Beast」 increases True DMG by 50%(150%) of Attack",
      },
    ],
    divinities: ["marksman-def", "atk-spd"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 8.44.35 AM.png, 8.44.28 AM.png, 8.44.29 AM.png, 8.44.30 AM.png, 8.44.32 AM.png, 8.44.34 AM.png.
  // Artifact tab: 8.44.37 AM.png; abilities: 8.44.38 AM.png.
  // Core continuations: 8.44.35 AM 1.png, 8.44.31 AM.png.
  "snow-hunter": {
    artifact: {
      name: "Flash Bow",
      iconUrl: "/artifacts/snow-hunter.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Frost Arrows",
          description:
            '"Frost Arrows" Reduces the Knockback Resist of hit targets by 25% within 5s.',
        },
        {
          tier: "gold",
          skill: "Multiarrow",
          description:
            '"Multiarrow" Increases the Physical DMG dealt by each arrow by 30%',
        },
        {
          tier: "red",
          skill: "Freezing Arrows",
          description:
            '"Freezing Arrows" Upon release, increases ATK SPD by 100% within 6s.',
        },
        {
          tier: "rainbow",
          skill: "Multiarrow",
          description:
            '"Multiarrow" No. of arrows +3, and turns DMG dealt by the arrows to True DMG.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Freezing Arrows",
        unlockStars: 0,
        iconUrl: talent("snow-hunter", "freezing-arrows"),
        description:
          "Shoot a Freezing Arrow forward and deal Physical DMG equal to 400% of ATK to a single target, freezing it for 2s. Freezing Arrows will explode upon hitting the target, dealing Physical DMG equal to 200% of ATK to enemy targets within range",
      },
      {
        kind: "battle",
        name: "Frost Arrows",
        unlockStars: 2,
        iconUrl: talent("snow-hunter", "frost-arrows"),
        description:
          "Basic ATK will deal Physical DMG to the target equal to 150% of ATK, reducing their MOV SPD by 30% for 1.5s",
      },
      {
        kind: "enhance",
        name: "Speedfrost Arrowhead",
        unlockStars: 5,
        iconUrl: talent("snow-hunter", "speedfrost-arrowhead"),
        description:
          "Freezing Arrows Increases the Physical DMG dealt by 100%, and extends the freeze duration by 1s.",
      },
      {
        kind: "battle",
        name: "Multiarrow",
        unlockStars: 8,
        iconUrl: talent("snow-hunter", "multiarrow"),
        description:
          "At set intervals, release 4 arrows forward, with each arrow dealing Physical DMG equal to 40% of ATK and inflicting Slowdown effect. When the same target is hit by Multiarrow for 3 time(s), it will be frozen again for 1.5s",
      },
      {
        kind: "attribute",
        name: "Focus",
        unlockStars: 12,
        iconUrl: talent("snow-hunter", "focus"),
        description: "ATK increased by 10%, Armor PEN increased by 15%",
      },
      {
        kind: "enhance",
        name: "Explosive Arrows",
        unlockStars: 16,
        iconUrl: talent("snow-hunter", "explosive-arrows"),
        description:
          "Freezing Arrows Increases the explosion range by 25%, freezing enemy targets that are also within range.",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Freezing Arrows",
        description:
          "「Freezing Arrows」 increases 50% (150%) of Attack's Explosive DMG",
      },
      {
        name: "Arrow Core",
        skill: "Frost Arrows",
        description:
          "「Frost Arrows」 increases 20%(60%) of Attack's Physical DMG",
      },
      {
        name: "Hunter's Cloak",
        skill: "Multiarrow",
        description: "「Multiarrow」 increases Freeze Time by 0.5(1.5)s",
      },
      {
        name: "Crystal Pendant",
        skill: "Explosive Arrows",
        description:
          "「Explosive Arrows」 additionally increases Explosion Radius by 3%(9%)",
      },
    ],
    divinities: ["marksman-def", "crit-dmg-reduction"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 8.45.08 AM.png, 8.45.00 AM.png, 8.45.01 AM.png, 8.45.03 AM.png, 8.45.04 AM.png, 8.45.06 AM.png.
  // Artifact tab: 8.45.10 AM.png; abilities: 8.45.11 AM.png, 8.45.12 AM.png.
  // Core continuations: 8.45.08 AM 1.png, 8.45.03 AM 1.png.
  swordevil: {
    artifact: {
      name: "Slaughter",
      iconUrl: "/artifacts/swordevil.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Thunder Strike",
          description:
            '"Thunder Strike" Increases the chance of triggering by 10%',
        },
        {
          tier: "gold",
          skill: "Phantom Combo",
          description:
            '"Phantom Combo" Reduces the intervals of release by 15%, increase the Physical DMG dealt by the first slash by 50%',
        },
        {
          tier: "red",
          skill: "Sweep Army",
          description:
            '"Sweep Army" Knockback effect is increased by 50%, and will not decrease over time. In 6s after getting hit, targets have their healing effect reduced by 40%',
        },
        {
          tier: "rainbow",
          name: "Healing Guard",
          description:
            "When the HP first falls below 40%, summon a Healing Guard to recover 30% of Max HP for all allied heroes in 6s, while increasing DMG Reduction of self by 30%",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Sweep Army",
        unlockStars: 0,
        iconUrl: talent("swordevil", "sweep-army"),
        description:
          "Immediately removes all debuffs and unleashes a powerful sword aura to the front, dealing 3 wave(s) of Physical DMG equal to 130% of ATK to all enemies in its path with Knockback Effect. For every enemy the sword aura hits, the effect will be reduced by 5%",
      },
      {
        kind: "battle",
        name: "Thunder Strike",
        unlockStars: 2,
        iconUrl: talent("swordevil", "thunder-strike"),
        description:
          "Basic ATK has a 25% chance to randomly deal True DMG equal to 1.5~2.2 times of ATK to the enemy",
      },
      {
        kind: "enhance",
        name: "Skill Immunity",
        unlockStars: 5,
        iconUrl: talent("swordevil", "skill-immunity"),
        description:
          "Sweep Army Upon release, gains immunity against all Skill DMG and debuffs apart from Basic ATK for 2.5s",
      },
      {
        kind: "special",
        name: "Phantom Combo",
        unlockStars: 8,
        iconUrl: talent("swordevil", "phantom-combo"),
        description:
          "In a set interval, summons a clone to randomly attack an enemy target 5 times. The first slash will deal Physical DMG equal to 70% of ATK, and all subsequent slashes will each deal Physical DMG equal to 18% of ATK",
      },
      {
        kind: "attribute",
        name: "Strength Awakening",
        unlockStars: 12,
        iconUrl: talent("swordevil", "strength-awakening"),
        description: "CRIT Rate increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Gale Aura",
        unlockStars: 16,
        iconUrl: talent("swordevil", "gale-aura"),
        description:
          "Sweep Army deals bonus damage equal to 10% of the target's current Max HP (capped at 300% of Swordevil's Attack). Furthermore, the first enemy struck is stunned for 3 seconds.",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Sweep Army",
        description:
          "「Sweep Army」 deals additional Physical DMG equal to 40%(120%) of Attack",
      },
      {
        name: "Cavalier Helm",
        skill: "Thunder Strike",
        description:
          "「Thunder Strike」 deals additional True DMG equal to 0.5(1.5) times Attack",
      },
      {
        name: "Brawler's Armor",
        skill: "Skill Immunity",
        description: "「Skill Immunity」 extends Immune duration by 0.5(1.5)s",
      },
      {
        name: "Brawler's Boots",
        skill: "Phantom Combo",
        description:
          "「Phantom Combo」 Each slash after the first deals additional Physical DMG equal to 15%(45%) of Attack",
      },
    ],
    divinities: ["crit-damage", "crit-rate"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III not supplied.
  // Talent popups (0/2/5/8/12/16★): 8.45.24 AM.png, 8.45.16 AM.png, 8.45.18 AM.png, 8.45.20 AM.png, 8.45.22 AM.png, 8.45.23 AM.png.
  // Artifact tab: 8.45.27 AM.png; abilities: 8.45.28 AM.png.
  // Core continuations: 8.45.25 AM.png, 8.45.17 AM.png.
  mars: {
    artifact: {
      name: "Spear of War",
      iconUrl: "/artifacts/mars.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Shield Bash",
          description:
            'Increases the chance to trigger "Shield Bash" by 15%, increases the Physical DMG dealt by 200%',
        },
        {
          tier: "gold",
          skill: "DEF Stance",
          description: 'Extends the duration of "DEF Stance" by 100%',
        },
        {
          tier: "red",
          skill: "Shield Bash",
          description:
            'Each trigger of "Shield Bash" will increase Block by 4%, max 8 stacks',
        },
        {
          tier: "rainbow",
          skill: "Spear of War",
          description:
            'When releasing the "Spear of War", there is a 70% chance to penetrate the target. Deals the same DMG and effect to 2 enemy targets in the front.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Spear of War",
        unlockStars: 0,
        iconUrl: talent("mars", "spear-of-war"),
        description:
          "Casts a Long Spear to deal Physical DMG equal to 1200% of ATK to a single target, with Interrupt and Knockback Effect on target",
      },
      {
        kind: "battle",
        name: "Shield Bash",
        unlockStars: 2,
        iconUrl: talent("mars", "shield-bash"),
        description:
          "Basic ATK has a 20% chance to deal Physical DMG equal to 300% of ATK to the target and knockback the target for a certain distance",
      },
      {
        kind: "enhance",
        name: "Enhance Spear Strike",
        unlockStars: 5,
        iconUrl: talent("mars", "enhance-spear-strike"),
        description:
          "Spear of War Stuns the target for 3s, and reduces their healing effect by 35% for 5s",
      },
      {
        kind: "special",
        name: "DEF Stance",
        unlockStars: 8,
        iconUrl: talent("mars", "def-stance"),
        description:
          "Upon entering the battlefield, sacrifice 20% MOV SPD and increase Block by 30% and Knockback Resist by 30%. The effect will gradually decrease over time.",
      },
      {
        kind: "attribute",
        name: "Protective Shield",
        unlockStars: 12,
        iconUrl: talent("mars", "protective-shield"),
        description: "Increase Ranged DMG Reduct by 25%",
      },
      {
        kind: "enhance",
        name: "Blood-Stained Spear",
        unlockStars: 16,
        iconUrl: talent("mars", "blood-stained-spear"),
        description:
          "Increases the Knockback Effect of Spear of War by 50%, and deals additional DMG equal to 15% of the lost HP of the target (capped at 500% of Mars' ATK)",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Spear of War",
        description:
          "「Spear of War」 Increase Physical DMG equal to 200%(600%) of ATK",
      },
      {
        name: "Cavalier Helm",
        skill: "Shield Bash",
        description:
          "「Shield Bash」 increases Physical DMG by 50%(150%) of ATK",
      },
      {
        name: "Brawler's Armor",
        skill: "Enhance Spear Strike",
        description:
          "「Enhance Spear Strike」 additionally reduces the target's Healing Effect by 10% (30%)",
      },
      {
        name: "Brawler's Boots",
        skill: "DEF Stance",
        description:
          "「DEF Stance」 grants an additional 10% (30%) chance to Block",
      },
    ],
    divinities: ["atk", "physical-res"],
  },
  // Owner screenshots from 2026-09-14; Awakening I/III intentionally unrecorded.
  // Talent popups (0/2/5/8/12/16★): 7.53.30 AM.png, 7.53.22 AM.png, 7.53.24 AM.png, 7.53.25 AM.png, 7.53.27 AM.png, 7.53.28 AM.png.
  hela: {
    artifact: {
      name: "Spectral Crystal",
      iconUrl: "/artifacts/hela.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Dark Swarm",
          description:
            'The triggering probability of "Dark Swarm" increases by 5%',
        },
        {
          tier: "gold",
          skill: "Soul Shackles",
          description:
            '"Soul Shackles" can inflict a silence effect lasting 4s',
        },
        {
          tier: "red",
          skill: "Spectral Servant",
          description:
            '"Spectral Servant" Magic DMG dealt increases by 10%. Enemies hit by the specters have their DEF reduced by 10% and Energy Recovery SPD reduced by 10% for 6s (up to 3 stacks)',
        },
        {
          tier: "rainbow",
          name: "Aura of Dread",
          description:
            "Reduces DMG results inflicted by all enemy units by 10%. Every 8s, reduces the energy of the enemy with the highest Energy by 200 points",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Spectral Servant",
        unlockStars: 0,
        iconUrl: "/talents/hela/spectral-servant.png",
        description:
          "Release a multitude of specters swirling around. Every 0.4s, each specter will randomly attack a enemy target, dealing Magic DMG equal to 50% of ATK, lasting for 6s",
      },
      {
        kind: "battle",
        name: "Dark Swarm",
        unlockStars: 2,
        iconUrl: "/talents/hela/dark-swarm.png",
        description:
          "Basic ATK have a 20% chance to release a swarm forward, dealing Magic DMG equal to 180% of ATK to targets within range. Targets hit by this effect have their healing effect reduced by 50% for 5s",
      },
      {
        kind: "enhance",
        name: "Spectral Drain",
        unlockStars: 5,
        iconUrl: "/talents/hela/spectral-drain.png",
        description:
          "Spectral Servant Each time the Specter deals damage, 30% of the damage is converted into self HP",
      },
      {
        kind: "special",
        name: "Soul Shackles",
        unlockStars: 8,
        iconUrl: "/talents/hela/soul-shackles.png",
        description:
          "At regular intervals, deals Magic DMG equal to 120% of ATK to all targets who use magic attacks",
      },
      {
        kind: "attribute",
        name: "Undead Corpse",
        unlockStars: 12,
        iconUrl: "/talents/hela/undead-corpse.png",
        description: "ATK increased by 15%, HP increased by 10%",
      },
      {
        kind: "enhance",
        name: "Spectres",
        unlockStars: 16,
        iconUrl: "/talents/hela/spectres.png",
        description:
          "Spectral Servant The ATK frequency changes to 0.3s. The Magic DMG inflicted by specters increases by 8%",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Spectral Servant",
        description:
          "「Spectral Servant」 inflicts additional Magic DMG equal to 15% of ATK",
      },
      {
        name: "Arcane Hat",
        skill: "Dark Swarm",
        description: "「Dark Swarm」 trigger chance raised by 18%",
      },
      {
        name: "Mage Robe",
        skill: "Spectral Drain",
        description:
          "「Spectral Drain」 additionally boosts life conversion ratio by 5%(15%)",
      },
      {
        name: "Spell Tome",
        skill: "Soul Shackles",
        description:
          "「Soul Shackles」 inflicts additional Magic DMG equal to 40%(120%) of ATK",
      },
    ],
    divinities: ["spd-reduction-res", "crit-rate"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.54.16 AM.png, 7.54.03 AM 1.png, 7.54.05 AM.png, 7.54.07 AM.png, 7.54.09 AM.png, 7.54.11 AM.png.
  "shadow-master": {
    artifact: {
      name: "Grass Cutting Sword",
      iconUrl: "/artifacts/shadow-master.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Illusory Nightmare",
          description:
            '"Illusory Nightmare" Immediately releases upon entering the battlefield, then releases once per 15s.',
        },
        {
          tier: "gold",
          skill: "Flame Bullet",
          description:
            '"Flame Bullet" Now activates once every 10s, Fireball count +3',
        },
        {
          tier: "red",
          skill: "Phantom Slash",
          description:
            '"Phantom Slash" Increases the DMG range by 30%. Increases the stun duration of hit targets by 1.5s',
        },
        {
          tier: "rainbow",
          name: "Soulkeeping Technique",
          description:
            "Whenever an allied hero is defeated, increase ATK by 18% and CRIT Rate by 10% (stackable).",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Phantom Slash",
        unlockStars: 0,
        iconUrl: "/talents/shadow-master/phantom-slash.png",
        description:
          "Summoned spirits will activate spin-slash and deal 440% Physical DMG to enemies within range.",
      },
      {
        kind: "special",
        name: "Illusory Nightmare",
        unlockStars: 2,
        iconUrl: "/talents/shadow-master/illusory-nightmare.png",
        description:
          "Upon entering the Battlefield, causes one enemy target with the highest Physical ATK to enter Nightmare for 5s, and reduces its ATK by 20% for 5s after waking up (Enemies in nightmare cannot be awakened by Dispel-type skills)",
      },
      {
        kind: "enhance",
        name: "Enhance Slash",
        unlockStars: 5,
        iconUrl: "/talents/shadow-master/enhance-slash.png",
        description:
          '"Phantom Slash" Increases the Physical DMG dealt by 80%, with stun effects lasting for 1.5s',
      },
      {
        kind: "special",
        name: "Flame Bullet",
        unlockStars: 8,
        iconUrl: "/talents/shadow-master/flame-bullet.png",
        description:
          "Upon entering the battlefield, at the 10/20/40/60 second, shoot three fireballs at enemies. Each fireball will deal Physical DMG equal to 70% of ATK to single enemy targets and inflict Interruption effects. When the same target is hit by fireballs for 3 times, it will be stunned for 3s.",
      },
      {
        kind: "attribute",
        name: "Weakness Break",
        unlockStars: 12,
        iconUrl: "/talents/shadow-master/weakness-break.png",
        description: "ATK increased by 15%, CRIT Rate increased by 10%",
      },
      {
        kind: "enhance",
        name: "Blood Thirst",
        unlockStars: 16,
        iconUrl: "/talents/shadow-master/blood-thirst.png",
        description:
          "Phantom Slash cuts into the target's vitality, dealing bonus damage equal to 10% of their Max HP (capped at 300% of the Shadow Master's Attack).",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Phantom Slash",
        description:
          "「Phantom Slash」 inflicts additional Physical DMG equal to 50%(150%) of Attack",
      },
      {
        name: "Arrow Core",
        skill: "Illusory Nightmare",
        description:
          "「Illusory Nightmare」 further reduces the target's Attack by 5%(15%)",
      },
      {
        name: "Hunter's Cloak",
        skill: "Flame Bullet",
        description:
          "「Flame Bullet」 causes each fireball to deal additional Physical DMG equal to 20%(60%) of your Attack",
      },
      {
        name: "Crystal Pendant",
        skill: "Blood Thirst",
        description:
          "「Blood Thirst」 converts 6%(18%) of the DMG dealt by Phantom Slash into your own HP",
      },
    ],
    divinities: ["ranged-dmg-boost", "knockback-effect"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.54.48 AM.png, 7.54.40 AM.png, 7.54.41 AM.png, 7.54.42 AM.png, 7.54.45 AM.png, 7.54.46 AM.png.
  medusa: {
    artifact: {
      name: "Succubus Mask",
      iconUrl: "/artifacts/medusa.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Piercing Arrows",
          description:
            '"Piercing Arrow" Increases Physical DMGto the first target by 100%',
        },
        {
          tier: "gold",
          skill: "Energy Barrier",
          description:
            '"Energy Barrier" Increases DMG absorption ratio by 25%. During Energy Barrier activation, increases ATK SPD by 50%',
        },
        {
          tier: "red",
          skill: "Arcane Serpent",
          description:
            '"Arcane Serpent" Steals 35 energy points from the target each time it deals DMG Passive</c: When receiving single-instance DMG exceeding 10% of maximum HP, instantly release 1 single-target Arcane Serpents towards the attacker (Cooldown: 6s)',
        },
        {
          tier: "rainbow",
          skill: "Arcane Serpent",
          description:
            '"Arcane Serpent" Bounces +2, and inflicts a 2s stun effect',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Energy Barrier",
        unlockStars: 0,
        iconUrl: "/talents/medusa/energy-barrier.png",
        description:
          "Passive: When energy is higher than 50%, create an Energy Barrier to absorb 50% of DMG taken. Each point of energy can absorb DMG equal to 0.02% of HP. Energy Barrier automatically shuts down when energy falls below 10%",
      },
      {
        kind: "battle",
        name: "Piercing Arrows",
        unlockStars: 2,
        iconUrl: "/talents/medusa/piercing-arrows.png",
        description:
          "Basic ATK release Piercing Arrows to attack the first 3 enemy targets in front, dealing Physical DMG equal to 150% of ATK to the first target and 100% Physical DMG to other targets",
      },
      {
        kind: "enhance",
        name: "Ultimate Empower",
        unlockStars: 5,
        iconUrl: "/talents/medusa/ultimate-empower.png",
        description:
          "Energy Barrier Increases DMG absorption by 25% per point of energy",
      },
      {
        kind: "special",
        name: "Arcane Serpent",
        unlockStars: 8,
        iconUrl: "/talents/medusa/arcane-serpent.png",
        description:
          "In a set interval, release Arcane Serpents to bounce between enemy heroes 3 times, dealing Physical DMG equal to 120% of ATK in the first hit. Then Physical DMG of each following bounce increased by 60% (affects each enemy hero only once)",
      },
      {
        kind: "attribute",
        name: "Succubus Ancestry",
        unlockStars: 12,
        iconUrl: "/talents/medusa/succubus-ancestry.png",
        description: "ATK increased by 15%, Energy Regen SPD increased by 10%",
      },
      {
        kind: "enhance",
        name: "Sharp Arrowhead",
        unlockStars: 16,
        iconUrl: "/talents/medusa/sharp-arrowhead.png",
        description:
          "Piercing Arrow Targets +1, increases Physical DMG to other targets by 50%",
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Piercing Arrows",
        description:
          "「Piercing Arrows」 each attack drains 2(6) point(s) of energy from the target.",
      },
      {
        name: "Arrow Core",
        skill: "Ultimate Empower",
        description:
          "「Ultimate Empower」 additionally boosts DMG Absorption by 2%(6%).",
      },
      {
        name: "Hunter's Cloak",
        skill: "Arcane Serpent",
        description:
          "「Arcane Serpent」 First attack deals bonus Physical DMG equal to 20%(60%) of ATK; each subsequent attack deals bonus Physical DMG equal to 10%(30%) of ATK.",
      },
      {
        name: "Crystal Pendant",
        skill: "Sharp Arrowhead",
        description:
          "「Sharp Arrowhead」 deals bonus Physical DMG to other targets equal to 10%(30%) of ATK.",
      },
    ],
    divinities: ["ranged-dmg-boost", "dmg-increase"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.55.06 AM.png, 7.54.59 AM.png, 7.55.01 AM.png, 7.55.02 AM.png, 7.55.04 AM.png, 7.55.05 AM.png.
  "two-headed-dragon": {
    artifact: {
      name: "Icy Heart",
      iconUrl: "/artifacts/two-headed-dragon.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Ice and Fire",
          description: '"Ice and Fire" Increases the trigger chance by 10%',
        },
        {
          tier: "gold",
          skill: "Icy Inferno",
          description:
            '"Icy Inferno" Damage radius increased by 30%, and the DMG dealt to enemies becomes True DMG.',
        },
        {
          tier: "red",
          skill: "Frost Domain",
          description:
            '"Frost Domain" Upon release, knocks back all enemies for a certain distance, and increases the Magic DMG dealt by the cold aura per second by 60%.',
        },
        {
          tier: "rainbow",
          skill: "Frost Domain",
          description:
            '"Frost Domain" Reduces the Energy needed for each release by 20%.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Frost Domain",
        unlockStars: 0,
        iconUrl: "/talents/two-headed-dragon/frost-domain.png",
        description:
          "The Two-headed Dragon exhales a large amount of frost to the front, reducing the MOV SPD of enemies in range by 30% within 4, dealing Magic DMG equal to 40% of ATK every second. All enemies within the freezing range will be frozen for 2.5s after the cold aura is lifted.",
      },
      {
        kind: "battle",
        name: "Ice and Fire",
        unlockStars: 2,
        iconUrl: "/talents/two-headed-dragon/ice-and-fire.png",
        description:
          "Basic ATK have a 35% chance to release either Liquid Fire or Frost (Liquid Fire deals Magic ATK equal to 135% of ATK to targets in range and interrupts their casting, while Liquid Frost deals Magic ATK equal to 100% of ATK to enemies and freezes them for 2s)",
      },
      {
        kind: "enhance",
        name: "Enhance Chill",
        unlockStars: 5,
        iconUrl: "/talents/two-headed-dragon/enhance-chill.png",
        description:
          "Frost Domain Releases the cold aura to reduce enemies' MOV SPD by 10% and additionally reduce their ATK SPD by 10%",
      },
      {
        kind: "battle",
        name: "Icy Inferno",
        unlockStars: 8,
        iconUrl: "/talents/two-headed-dragon/icy-inferno.png",
        description:
          "At set interval, the Two-headed Dragon's two heads will exhale Ice and Fire forward, dealing Magic DMG equal to 50% of ATK to enemies in range for 2 time",
      },
      {
        kind: "attribute",
        name: "Dragon's Blood",
        unlockStars: 12,
        iconUrl: "/talents/two-headed-dragon/dragon-s-blood.png",
        description: "ATK increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Extreme Cold",
        unlockStars: 16,
        iconUrl: "/talents/two-headed-dragon/extreme-cold.png",
        description:
          "Frost Domain Reduces the Energy used by 25% for the first release. Increases the freezing duration on enemies by 1.5s",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Frost Domain",
        description:
          "「Frost Domain」 inflicts Magic DMG equal to 10%(30%) of ATK per second",
      },
      {
        name: "Arcane Hat",
        skill: "Ice and Fire",
        description:
          "「Ice and Fire」 inflicts additional Magic DMG equal to 30%(90%) of ATK",
      },
      {
        name: "Mage Robe",
        skill: "Enhance Chill",
        description:
          "「Enhance Chill」 additionally reduces ATK SPD by 12%(36%)",
      },
      {
        name: "Spell Tome",
        skill: "Icy Inferno",
        description:
          "「Icy Inferno」 each time inflicts Magic DMG equal to 10%(30%) of ATK",
      },
    ],
    divinities: ["hp", "heavy-injury"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.55.28 AM.png, 7.55.19 AM.png, 7.55.20 AM.png, 7.55.21 AM.png, 7.55.24 AM.png, 7.55.26 AM.png.
  "mermaid-princess": {
    artifact: {
      name: "Shallow Staff",
      iconUrl: "/artifacts/mermaid-princess.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Deep Sea Blessing",
          description: '"Deep Sea Blessing" Increases effect duration by 25s.',
        },
        {
          tier: "gold",
          skill: "Sanctus Waterball",
          description:
            '"Sanctus Waterball" Bounce count increased by 2 time(s), and the healing effect no longer diminishes over time.',
        },
        {
          tier: "red",
          skill: "Tide of Sighs",
          description:
            '"Tide of Sighs" Allied heroes within the water domain recover HP equal to 100% of the Mermaid Princess’s ATK per second.',
        },
        {
          tier: "rainbow",
          skill: "Deep Sea Blessing",
          description:
            '"Deep Sea Blessing" Additionally increases other allied heroes\' damage output by 15%.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Tide of Sighs",
        unlockStars: 0,
        iconUrl: "/talents/mermaid-princess/tide-of-sighs.png",
        description:
          "Launches a waterball forward, dealing Magic DMG equal to 400% of ATK to a single target. Upon contact, the waterball creates a 350 water domain that lasts for 3s. Enemies entering this domain will have their MOV SPD reduced by 50%.",
      },
      {
        kind: "special",
        name: "Deep Sea Blessing",
        unlockStars: 2,
        iconUrl: "/talents/mermaid-princess/deep-sea-blessing.png",
        description:
          "Upon entering the battlefield, enhance the allied hero with the highest ATK, increasing their DMG Result by 25% for 15s.",
      },
      {
        kind: "enhance",
        name: "Tidal Phenomenon",
        unlockStars: 5,
        iconUrl: "/talents/mermaid-princess/tidal-phenomenon.png",
        description:
          "Tide of Sighs Increases the area of the created water domain by 30%.",
      },
      {
        kind: "special",
        name: "Sanctus Waterball",
        unlockStars: 8,
        iconUrl: "/talents/mermaid-princess/sanctus-waterball.png",
        description:
          "At set intervals, fires a healing waterball at the weakest allied hero, bouncing 3 times among allies, with each bounce restoring 150% of the Mermaid Princess’s ATK as HP (each Heal reduces the effect by 10%, and each ally can only be healed 1 times).",
      },
      {
        kind: "attribute",
        name: "Knockback",
        unlockStars: 12,
        iconUrl: "/talents/mermaid-princess/knockback.png",
        description: "Knockback effect increased by 15%, HP increased by 10%.",
      },
      {
        kind: "enhance",
        name: "Abyssal Waters",
        unlockStars: 16,
        iconUrl: "/talents/mermaid-princess/abyssal-waters.png",
        description:
          "Tide of Sighs Extends the duration of the created water domain by 1.5s, and enemies entering the water area will be unable to regen Energy.",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Tide of Sighs",
        description:
          "「Tide of Sighs」 increases Magic DMG by 50% (150%) of Attack.",
      },
      {
        name: "Tome of Radiance",
        skill: "Deep Sea Blessing",
        description:
          "「Deep Sea Blessing」 additionally increases the DMG Result of the allied Hero with the highest Attack by 3% (9%).",
      },
      {
        name: "Luminous Visor",
        skill: "Sanctus Waterball",
        description:
          "「Sanctus Waterball」 additionally restores 30% (90%) of Attack as HP.",
      },
      {
        name: "Resonance Pendant",
        skill: "Abyssal Waters",
        description:
          "「Abyssal Waters」 additionally reduces the Melee DMG Reduct of enemies within its area by 10% (30%).",
      },
    ],
    divinities: ["hp", "anti-control-rate"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.55.46 AM.png, 7.55.39 AM.png, 7.55.40 AM.png, 7.55.41 AM.png, 7.55.43 AM.png, 7.55.45 AM.png.
  "soul-doll": {
    artifact: {
      name: "Ghost Blade",
      iconUrl: "/artifacts/soul-doll.png",
      bonuses: [
        {
          tier: "purple",
          skill: "ATK Enhancement",
          description:
            '"ATK Enhancement" Increases the DMG Dealt by Basic ATK by 1.5% of Max HP.',
        },
        {
          tier: "gold",
          skill: "Thread Bind",
          description: '"Thread Bind" When in effect, increases ATK by 1%.',
        },
        {
          tier: "red",
          skill: "Soul Scissors",
          description:
            '"Soul Scissors" Within 5s of use, increases Knockback Resist by 35% and DMG Reduction by 20%.',
        },
        {
          tier: "rainbow",
          skill: "Soul Scissors",
          description:
            '"Soul Scissors" Upon defeating an enemy, immediately restores 25% Energy.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Soul Scissors",
        unlockStars: 0,
        iconUrl: "/talents/soul-doll/soul-scissors.png",
        description:
          "Summon a giant pair of scissors to snip the most vulnerable target in the enemy team 5 times, dealing Physical DMG equal to 260% of ATK with each snip.",
      },
      {
        kind: "battle",
        name: "ATK Enhancement",
        unlockStars: 2,
        iconUrl: "/talents/soul-doll/atk-enhancement.png",
        description:
          "Basic ATK deals DMG to the target equal to 2% of Max HP (cannot exceed 200% of Soul Doll’s ATK).",
      },
      {
        kind: "enhance",
        name: "Enhance Scissors",
        unlockStars: 5,
        iconUrl: "/talents/soul-doll/enhance-scissors.png",
        description: "Soul Scissors Increases Physical DMG dealt by 60%.",
      },
      {
        kind: "passive",
        name: "Thread Bind",
        unlockStars: 8,
        iconUrl: "/talents/soul-doll/thread-bind.png",
        description: "For every 3% of HP lost, gain 1% in DEF.",
      },
      {
        kind: "attribute",
        name: "Spiritual Cultivation",
        unlockStars: 12,
        iconUrl: "/talents/soul-doll/spiritual-cultivation.png",
        description: "ATK increased by 10%, HP increased by 15%.",
      },
      {
        kind: "enhance",
        name: "Heavy Blow",
        unlockStars: 16,
        iconUrl: "/talents/soul-doll/heavy-blow.png",
        description:
          "Soul Scissors Energy cost for each cast is reduced by 25%. And in 8s after getting hit, targets have their healing effect reduced by 35%.",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Soul Scissors",
        description:
          "「Soul Scissors」 each cut increases Physical DMG by 20% (60%) of ATK.",
      },
      {
        name: "Cavalier Helm",
        skill: "ATK Enhancement",
        description:
          "「ATK Enhancement」 additionally reduces the target’s DEF by 10% (30%) for 4s.",
      },
      {
        name: "Brawler's Armor",
        skill: "Thread Bind",
        description: "「Thread Bind」 additionally gains 0.3% (1%) DEF.",
      },
      {
        name: "Brawler's Boots",
        skill: "Heavy Blow",
        description:
          "「Heavy Blow」 additionally reduces the target’s received healing by 10% (30%).",
      },
    ],
    divinities: ["receive-healing", "melee-dmg-boost"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.56.21 AM.png, 7.56.14 AM.png, 7.56.15 AM.png, 7.56.16 AM.png, 7.56.19 AM.png, 7.56.20 AM.png.
  baphomet: {
    artifact: {
      name: "Demonic Slash",
      iconUrl: "/artifacts/baphomet.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Devil's Entanglement",
          description:
            '"Devil\'s Entanglement" Changed to releasing once per 10s. Increases the Physical DMG dealt by each slash by 30%.',
        },
        {
          tier: "gold",
          skill: "Demonify",
          description:
            '"Demonify" Increases the effect duration by 2s. Targets hit have their healing effect reduced by 30%. Transformation would immediately knockback enemies in a small range.',
        },
        {
          tier: "red",
          skill: "Demonify",
          description:
            '"Demonify" Increases effect duration by 30%. ATK will now splatter, dealing Physical DMG equal to 50% of ATK to surrounding enemies in a small range.',
        },
        {
          tier: "rainbow",
          name: "Soul Absorption",
          description:
            "When the HP first falls below 35%, absorbs 30% of Max HP from the enemy with the highest HP (cannot exceed 1000% of the Baphomet’s ATK).",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Demonify",
        unlockStars: 0,
        iconUrl: "/talents/baphomet/demonify.png",
        description:
          "The Baphomet will transform into a powerful demon with Ranged ATK abilities with a range of 600%. ATK will be increased by 50%, lasting for 6s.",
      },
      {
        kind: "enhance",
        name: "Fanatic",
        unlockStars: 2,
        iconUrl: "/talents/baphomet/fanatic.png",
        description: "Demonify When in effect, increases ATK by 100%.",
      },
      {
        kind: "enhance",
        name: "Rebirth",
        unlockStars: 5,
        iconUrl: "/talents/baphomet/rebirth.png",
        description: "Demonify will immediately recover 10% of Max HP.",
      },
      {
        kind: "special",
        name: "Devil's Entanglement",
        unlockStars: 8,
        iconUrl: "/talents/baphomet/devil-s-entanglement.png",
        description:
          "Upon entering the battlefield, summons a small demon every 10s/25s/45s/70s. The demon inflicts 7 attacks against the enemy with the highest ATK, each dealing Physical DMG equal to 40% of ATK. The target’s ATK is reduced by 20%, and healing received is reduced by 50% for 6s.",
      },
      {
        kind: "attribute",
        name: "Devil's Wit",
        unlockStars: 12,
        iconUrl: "/talents/baphomet/devil-s-wit.png",
        description: "ATK increased by 15%, HP increased by 10%.",
      },
      {
        kind: "enhance",
        name: "RES Skin",
        unlockStars: 16,
        iconUrl: "/talents/baphomet/res-skin.png",
        description:
          "Demonify When in effect, increases Ranged DMG Reduction by 20% and Knockback Resist by 80%. The effect will diminish over time.",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Demonify",
        description: "「Demonify」 additionally increases ATK by 12% (36%).",
      },
      {
        name: "Cavalier Helm",
        skill: "Rebirth",
        description: "「Rebirth」 additionally restores 3% (10%) of Max HP.",
      },
      {
        name: "Brawler's Armor",
        skill: "Devil's Entanglement",
        description:
          "「Devil's Entanglement」 each slash increases Physical DMG by 20% (60%) of ATK.",
      },
      {
        name: "Brawler's Boots",
        skill: "RES Skin",
        description:
          "「RES Skin」 Additionally increases Ranged DMG Reduction by 5% (15%).",
      },
    ],
    divinities: ["heavy-injury", "atk-spd"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.56.40 AM.png, 7.56.33 AM.png, 7.56.35 AM.png, 7.56.36 AM.png, 7.56.37 AM.png, 7.56.39 AM.png.
  "masked-ninja": {
    artifact: {
      name: "Silverwolf Sword",
      iconUrl: "/artifacts/masked-ninja.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Silent Movement",
          description: '"Silent Movement" Extends effect duration by 10s.',
        },
        {
          tier: "gold",
          skill: "Power Regen",
          description:
            '"Power Regen" Increases DEF by 35% when triggered, lasting till the battle ends.',
        },
        {
          tier: "red",
          skill: "Barrier Shield",
          description:
            '"Barrier Shield" When in effect, continuously recovers 3.5% of Max HP per second.',
        },
        {
          tier: "rainbow",
          skill: "Silent Movement",
          description:
            '"Silent Movement" When in effect, continuously increases Knockback Resist by 60%.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Barrier Shield",
        unlockStars: 0,
        iconUrl: "/talents/masked-ninja/barrier-shield.png",
        description:
          "Generate a barrier shield around yourself, increasing Magic DMG Reduction by 30%, lasting for 6s.",
      },
      {
        kind: "special",
        name: "Silent Movement",
        unlockStars: 2,
        iconUrl: "/talents/masked-ninja/silent-movement.png",
        description:
          "Upon entering the battlefield, increase MOV SPD by 35% and reduce DMG taken by 25%, lasting for 8s.",
      },
      {
        kind: "enhance",
        name: "Enhance Shield",
        unlockStars: 5,
        iconUrl: "/talents/masked-ninja/enhance-shield.png",
        description:
          "Barrier Shield Extends duration by 2s, increases Magic DMG Reduction by 5%.",
      },
      {
        kind: "passive",
        name: "Power Regen",
        unlockStars: 8,
        iconUrl: "/talents/masked-ninja/power-regen.png",
        description:
          "When receiving lethal damage, removes all debuffs and instantly restore 40% of Max HP (can only be triggered 1 time(s) per battle).",
      },
      {
        kind: "attribute",
        name: "Protect Charm",
        unlockStars: 12,
        iconUrl: "/talents/masked-ninja/protect-charm.png",
        description: "HP increased by 10%, Anti-CRIT Rate increased by 15%.",
      },
      {
        kind: "enhance",
        name: "Super Barrier",
        unlockStars: 16,
        iconUrl: "/talents/masked-ninja/super-barrier.png",
        description:
          "Barrier Shield Additionally increases Anti-Control Rate by 50% and Knockback Resist by 30%.",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Barrier Shield",
        description:
          "「Barrier Shield」 additionally increases Physical Resistance by 5% (15%).",
      },
      {
        name: "Cavalier Helm",
        skill: "Silent Movement",
        description:
          "「Silent Movement」 additionally reduces DMG taken by 3% (9%).",
      },
      {
        name: "Brawler's Armor",
        skill: "Power Regen",
        description:
          "「Power Regen」 additionally restores 10% (30%) of own Max HP.",
      },
      {
        name: "Brawler's Boots",
        skill: "Super Barrier",
        description:
          "「Super Barrier」 additionally increases Control Resistance and Knockback Resistance by 5% (15%).",
      },
    ],
    divinities: ["hp", "magic-res"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.56.58 AM.png, 7.56.52 AM.png, 7.56.53 AM.png, 7.56.54 AM.png, 7.56.55 AM.png, 7.56.56 AM.png.
  "whaley-imp": {
    artifact: {
      name: "Trident",
      iconUrl: "/artifacts/whaley-imp.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Wave Slash",
          description:
            'When "Wave Slash" hits a target, further decreases DEF by 10% within 5s',
        },
        {
          tier: "gold",
          name: "Siren's Protection",
          description: "Cleanses the debuffs on self every 8s",
        },
        {
          tier: "red",
          skill: "Tsunami",
          description:
            '"Tsunami" Increases the DMG range by 30%, and temporarily immobilizes the target.',
        },
        {
          tier: "rainbow",
          name: "Siren's Shell",
          description:
            "Upon entering the battlefield, increases Block chance by 18%, lasting until the end of the battle",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Tsunami",
        unlockStars: 0,
        iconUrl: "/talents/whaley-imp/tsunami.png",
        description:
          "Summon a Tidal Wave to attack targets in front, dealing Physical DMG equal to 480% of ATK with Knockback effect",
      },
      {
        kind: "battle",
        name: "Wave Slash",
        unlockStars: 2,
        iconUrl: "/talents/whaley-imp/wave-slash.png",
        description:
          "Basic ATK has a 25% chance to swing the blade, dealing Physical DMG equal to 300% of ATK to enemies in range and reducing their DMG Result by 15% for 5s",
      },
      {
        kind: "enhance",
        name: "Enhance Tide",
        unlockStars: 5,
        iconUrl: "/talents/whaley-imp/enhance-tide.png",
        description:
          "Tsunami reduces the target's MOV SPD by 40%, lasting for 5s",
      },
      {
        kind: "passive",
        name: "Surge Guard",
        unlockStars: 8,
        iconUrl: "/talents/whaley-imp/surge-guard.png",
        description:
          "When a single DMG exceeds 10% of the Max HP, reduce the DMG by 35%",
      },
      {
        kind: "attribute",
        name: "Deep Sea Buildup",
        unlockStars: 12,
        iconUrl: "/talents/whaley-imp/deep-sea-buildup.png",
        description: "HP increased by 25%",
      },
      {
        kind: "enhance",
        name: "Sea God's Wrath",
        unlockStars: 16,
        iconUrl: "/talents/whaley-imp/sea-god-s-wrath.png",
        description:
          "Increases the Knockback Effect of Tsunami by 50%. Upon use, increases DEF by 30%, lasting for 5s",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Tsunami",
        description: "「Tsunami」 increases Physical DMG by 50% (150%) of ATK",
      },
      {
        name: "Cavalier Helm",
        skill: "Wave Slash",
        description:
          "「Wave Slash」 additionally reduces enemy DMG dealt by 5% (15%)",
      },
      {
        name: "Brawler's Armor",
        skill: "Surge Guard",
        description:
          "「Surge Guard」 additionally reduces DMG taken by 5% (15%) when triggered",
      },
      {
        name: "Brawler's Boots",
        skill: "Sea God's Wrath",
        description:
          "「Sea God's Wrath」 additionally increases own DEF by 10% (30%)",
      },
    ],
    divinities: ["hp", "anti-control-rate"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.57.14 AM.png, 7.57.08 AM.png, 7.57.09 AM.png, 7.57.10 AM.png, 7.57.11 AM.png, 7.57.12 AM.png.
  "ironblade-mixed-race": {
    artifact: {
      name: "Ironwolf Blade",
      iconUrl: "/artifacts/ironblade-mixed-race.png",
      bonuses: [
        {
          tier: "purple",
          name: "Dragon Scale Protection",
          description: "Reduces Melee DMG taken by 20%",
        },
        {
          tier: "gold",
          skill: "Demonic Lineage",
          description:
            '"Demonic Lineage" For every 5% HP lost, increase HP Regen by 0.07%',
        },
        {
          tier: "red",
          skill: "Sky-Cutting Strike",
          description:
            '"Sky-Cutting Strike" Sword Aura has a 40% chance to deal the same DMG and effects to 3 enemy unit(s) in the front',
        },
        {
          tier: "rainbow",
          name: "Vampiric Powers",
          description:
            "Transforms into a demonic state when first receiving lethal damage, entering invincibility for 4s, MOV SPD increased by 20%",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Sky-Cutting Strike",
        unlockStars: 0,
        iconUrl: "/talents/ironblade-mixed-race/sky-cutting-strike.png",
        description:
          "Release a sword aura, dealing Physical DMG equal to 850% of ATK to 2 enemy target(s) with Interrupt and knockback effects",
      },
      {
        kind: "battle",
        name: "Armor-Breaking Blow",
        unlockStars: 2,
        iconUrl: "/talents/ironblade-mixed-race/armor-breaking-blow.png",
        description:
          "Basic ATK deal an additional 35% final DMG to warrior-class enemies",
      },
      {
        kind: "enhance",
        name: "Enhance Aura",
        unlockStars: 5,
        iconUrl: "/talents/ironblade-mixed-race/enhance-aura.png",
        description: '"Sky-Cutting Strike" Knockback effect increased by 30%',
      },
      {
        kind: "passive",
        name: "Demonic Lineage",
        unlockStars: 8,
        iconUrl: "/talents/ironblade-mixed-race/demonic-lineage.png",
        description:
          "Gain 2% ATK and 1% DMG reduction effects for every 5% HP lost",
      },
      {
        kind: "attribute",
        name: "Demonic Boost",
        unlockStars: 12,
        iconUrl: "/talents/ironblade-mixed-race/demonic-boost.png",
        description: "ATK increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Soul Hack",
        unlockStars: 16,
        iconUrl: "/talents/ironblade-mixed-race/soul-hack.png",
        description:
          "Sky-Cutting Strike deals bonus damage equal to 10% of the target's Max HP (capped at 500% of the Ironblade Mixed-Race's own Attack).",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Sky-Cutting Strike",
        description:
          "「Sky-Cutting Strike」 increases Physical DMG by 100% (300%) of ATK",
      },
      {
        name: "Cavalier Helm",
        skill: "Armor-Breaking Blow",
        description:
          "「Armor-Breaking Blow」 deals an additional 5% (15%) DMG when attacking Warrior-class enemies",
      },
      {
        name: "Brawler's Armor",
        skill: "Enhance Aura",
        description:
          "「Enhance Aura」 additionally increases Knockback effect by 10% (30%)",
      },
      {
        name: "Brawler's Boots",
        skill: "Demonic Lineage",
        description:
          "「Demonic Lineage」 reduces the HP loss requirement by 0.5% (1.5%)",
      },
    ],
    divinities: ["hp", "control-res"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.57.29 AM.png, 7.57.23 AM.png, 7.57.25 AM.png, 7.57.26 AM.png, 7.57.27 AM.png, 7.57.28 AM.png.
  "roar-warrior": {
    artifact: {
      name: "Blazing Sun Axe",
      iconUrl: "/artifacts/roar-warrior.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Thirst",
          description:
            '"Thirst" Deals Physical DMG equal to 30% of ATK per second to targets inflicted with HP Drain',
        },
        {
          tier: "gold",
          skill: "Roar",
          description: '"Roar" Increases an extra 20% in Magic DMG Reduction',
        },
        {
          tier: "red",
          skill: "Elimination Axe",
          description:
            '"Elimination Axe" Immediately restore 22% of Max HP upon defeating an enemy, and increases MOV SPD by 20% and Knockback Resist by 20% for a set duration. Effect will decrease over time.',
        },
        {
          tier: "rainbow",
          name: "Blade Vine Armor",
          description:
            "Upon entering the battlefield, increase Reflect DMG by 20%. Reduces the attacker’s DEF by 12% within 5s of being attacked.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Elimination Axe",
        unlockStars: 0,
        iconUrl: "/talents/roar-warrior/elimination-axe.png",
        description:
          "Swings a giant axe to cleave a single enemy, dealing 400% of Attack as True Damage. If the target's HP falls below 30%, inflicts an additional 50% Damage.",
      },
      {
        kind: "battle",
        name: "Thirst",
        unlockStars: 2,
        iconUrl: "/talents/roar-warrior/thirst.png",
        description:
          "Basic ATK cause the target to enter HP Drain for 10s. Targets in HP Drain effect have their healing effect reduced by 35%",
      },
      {
        kind: "enhance",
        name: "Enhance Great Axe",
        unlockStars: 5,
        iconUrl: "/talents/roar-warrior/enhance-great-axe.png",
        description: "Increases the True DMG dealt by Elimination Axe by 100%",
      },
      {
        kind: "special",
        name: "Roar",
        unlockStars: 8,
        iconUrl: "/talents/roar-warrior/roar.png",
        description:
          "Upon entering the battlefield, increases Physical DMG Reduction by 20%, lasting until the battle ends",
      },
      {
        kind: "attribute",
        name: "Battle Soul",
        unlockStars: 12,
        iconUrl: "/talents/roar-warrior/battle-soul.png",
        description: "DEF increased by 15%, HP increased by 10%",
      },
      {
        kind: "enhance",
        name: "Axe of Greatness",
        unlockStars: 16,
        iconUrl: "/talents/roar-warrior/axe-of-greatness.png",
        description:
          "Elimination Axe has a 100% chance to trigger additional damage. If the target is eliminated, restores Energy by an additional 40%",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Elimination Axe",
        description:
          "「Elimination Axe」 increases True DMG by 50% (150%) of ATK",
      },
      {
        name: "Cavalier Helm",
        skill: "Thirst",
        description:
          "「Thirst」 additionally reduces the target’s Healing Received by 10% (30%)",
      },
      {
        name: "Brawler's Armor",
        skill: "Roar",
        description:
          "「Roar」 additionally increases Physical DMG Reduction by 5% (15%)",
      },
      {
        name: "Brawler's Boots",
        skill: "Axe of Greatness",
        description:
          "「Axe of Greatness」 restores an additional 5% (15%) Energy upon killing an enemy",
      },
    ],
    divinities: ["atk", "heavy-injury"],
  },
  // Talent popups (0/2/5/8/12/16★): 7.57.47 AM.png, 7.57.38 AM.png, 7.57.39 AM.png, 7.57.40 AM.png, 7.57.44 AM.png, 7.57.45 AM.png.
  "monkey-king": {
    artifact: {
      name: "Golden Cudgel",
      iconUrl: "/artifacts/monkey-king.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Stabilizing Cudgel",
          description:
            '"Sea Stabilizing Needle" Increases HP transform effects by 10%',
        },
        {
          tier: "gold",
          skill: "Monkey Clone",
          description:
            '"Monkey Clone" Increases the HP inherited by the clone by 35%',
        },
        {
          tier: "red",
          skill: "Golden Cudgel",
          description:
            '"Golden Cudgel" Increases DMG Range by 250%, used immediately while ignoring distance',
        },
        {
          tier: "rainbow",
          skill: "Monkey Clone",
          description:
            '"Monkey Clone" Summon 2 clone(s), and increases DMG Reduction by 25% within 8s of the summon.',
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Golden Cudgel",
        unlockStars: 0,
        iconUrl: "/talents/monkey-king/golden-cudgel.png",
        description:
          "Swing the Ruyi Golden Cudgel to slam the ground, dealing Physical DMG equal to 600% of ATK to targets in range, stunning them for 2.5s",
      },
      {
        kind: "battle",
        name: "Stabilizing Cudgel",
        unlockStars: 2,
        iconUrl: "/talents/monkey-king/stabilizing-cudgel.png",
        description:
          "Basic ATK deals Physical DMG equal to 150% of ATK to the target and converts 15% to own HP",
      },
      {
        kind: "enhance",
        name: "Enhanced Strike",
        unlockStars: 5,
        iconUrl: "/talents/monkey-king/enhanced-strike.png",
        description: "Golden Cudgel Increases Physical DMG dealt by 140%",
      },
      {
        kind: "special",
        name: "Monkey Clone",
        unlockStars: 8,
        iconUrl: "/talents/monkey-king/monkey-clone.png",
        description:
          "Upon entering the battlefield, summon a clone that possesses 50% of the host’s HP (can only be triggered 1 time(s) per battle)",
      },
      {
        kind: "attribute",
        name: "Forest Dance",
        unlockStars: 12,
        iconUrl: "/talents/monkey-king/forest-dance.png",
        description: "ATK increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Ruyi Technique",
        unlockStars: 16,
        iconUrl: "/talents/monkey-king/ruyi-technique.png",
        description:
          "Golden Cudgel Increases the Physical DMG dealt by 140%, extends the Stun duration by 1s",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Golden Cudgel",
        description:
          "「Golden Cudgel」 deals additional DMG equal to 5% (15%) of the target’s lost HP (up to 180% (540%) of the Monkey King’s ATK)",
      },
      {
        name: "Cavalier Helm",
        skill: "Stabilizing Cudgel",
        description:
          "「Stabilizing Cudgel」 increases HP conversion ratio by 20% (60%)",
      },
      {
        name: "Brawler's Armor",
        skill: "Monkey Clone",
        description:
          "「Monkey Clone」 clones inherit 25% (75%) of own Special Stats",
      },
      {
        name: "Brawler's Boots",
        skill: "Ruyi Technique",
        description:
          "「Ruyi Technique」 increases Physical DMG by 100% (300%) of ATK",
      },
    ],
    divinities: ["knockback-resist", "dmg-reduction"],
  },
  // Owner's 2026-09-13 12.47.59–12.48.15 PM gameplay captures.
  "radiant-envoy": {
    // Owner-approved MR-UK excerpt (2026-09-13): unique skills in I/III order.
    // Source is the supplied guide, not an in-game awakening capture.
    awakeningSkills: [
      {
        stage: "I",
        name: "Radiant Glow",
        description:
          "When [Final Spark], [Light Binding], or [Prismatic Barrier] deals damage to an enemy, it applies a mark for 4s. Marked targets take 11% increased damage from Radiant Envoy (cannot be dispelled).",
        sourceScreenshot: "image.png",
      },
      {
        stage: "III",
        name: "Holy Light Field",
        description:
          "3s after entering battle, dispels all negative status effects from the 1 ally with the lowest HP percentage and grants status immunity for 20s. This state can trigger again when self HP drops below 50%.",
        sourceScreenshot: "image.png",
      },
    ],
    artifact: {
      name: "Wand of Light",
      iconUrl: "/artifacts/radiant-envoy.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Light Binding",
          description:
            'Increases the binding duration of "Light Binding" by 1s.',
        },
        {
          tier: "gold",
          skill: "Prismatic Barrier",
          description:
            '"Prismatic Barrier" is first cast 5 s after entering battle. Subsequent skill cooldowns are reduced by 3s.',
        },
        {
          tier: "red",
          skill: "Final Spark",
          description:
            'The beam range of "Final Spark" becomes full-screen. The beam additionally deals True DMG equal to 55% of Attack.',
        },
        {
          tier: "rainbow",
          name: "Lucent Singularity",
          description:
            "8 s after entering battle, conjures a zone of light at the feet of the farthest enemy. Enemies within the zone have their ATK SPD reduced by 25%. If an enemy is a Support, they are Silenced. The zone detonates after 3 s, dealing Magic DMG equal to 300% of Attack to enemies inside. Cooldown: 15s.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Final Spark",
        unlockStars: 0,
        iconUrl: talent("radiant-envoy", "final-spark"),
        description:
          "Unleashes a brilliant beam of light, dealing Magic DMG equal to 300% of Attack to enemies in a forward area and knocking them back.",
      },
      {
        kind: "battle",
        name: "Light Binding",
        unlockStars: 2,
        iconUrl: talent("radiant-envoy", "light-binding"),
        description:
          "Basic Attacks have a 35% chance to fire an orb of light, dealing Magic DMG equal to 200% of Attack to up to 2 forward enemies and binding them for 1 s.",
      },
      {
        kind: "enhance",
        name: "Enhanced Flash",
        unlockStars: 5,
        iconUrl: talent("radiant-envoy", "enhanced-flash"),
        description: "Increases Magic DMG dealt by Final Spark by 75%.",
      },
      {
        kind: "special",
        name: "Prismatic Barrier",
        unlockStars: 8,
        iconUrl: talent("radiant-envoy", "prismatic-barrier"),
        description:
          "Every 12s, hurls the wand forward. The wand grants allies in its path a Shield equal to 150% of Radiant Envoy's Attack for 6 s; and reduces Energy Regen speed of enemies in its path by 10% for 6 s. Repeatedly applied Bonuses or Bonus Reductions refresh their duration and do not stack.",
      },
      {
        kind: "passive",
        name: "Light Body",
        unlockStars: 12,
        iconUrl: talent("radiant-envoy", "light-body"),
        description: "ATK increased by 10%, HP increased by 15%.",
      },
      {
        kind: "enhance",
        name: "Beam Charge",
        unlockStars: 16,
        iconUrl: talent("radiant-envoy", "beam-charge"),
        description:
          "Energy cost to cast Final Spark is reduced by 15%. Enemies struck by the beam have their Damage dealt reduced by 15% for 6s.",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Final Spark",
        description:
          '"Final Spark" beam inflicts additional Magic DMG equal to 30% (90%) of Attack.',
      },
      {
        name: "Arcane Hat",
        skill: "Light Binding",
        description:
          '"Light Binding" light orb launch chance increases by 10% (30%).',
      },
      {
        name: "Mage Robe",
        skill: "Prismatic Barrier",
        // The 12.48.06 PM scroll completes the lower core panel.
        description:
          '"Prismatic Barrier" wand additionally reduces the Attack Speed of enemies in its path by 12% (36%) for 6s.',
      },
      {
        name: "Spell Tome",
        skill: "Beam Charge",
        // Preserve both the displayed 27% (80%) and "Melee DMG Reduction" wording.
        description:
          '"Beam Charge" enemies struck by the beam suffer an additional 27% (80%) reduction to their Melee DMG Reduction for 6s.',
      },
    ],
    divinities: ["dmg-increase", "magic-dmg-boost"],
  },
  "jungle-envoy": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Force of Nature",
        description:
          "Reduces all enemies’ Attack by 15% for 12s after entering the battlefield; the effect then gradually decreases over the next 18s, disappearing after 30s of battle",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.33.24\u202fAM.png",
      },
      {
        stage: "III",
        name: "Tranquil Redemption",
        description:
          "Each time Lightning Storm or Demonic Edict is cast, heals the ally with the lowest HP for 130% of own ATK.",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.33.25\u202fAM.png",
      },
    ],
    artifact: {
      name: "Verdant Staff",
      iconUrl: "/artifacts/jungle-envoy.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Lightning Storm",
          description: "Lightning additionally strikes 1 other enemies.",
        },
        {
          tier: "gold",
          skill: "Demonic Edict",
          description:
            "First cast time is reduced to 5s after the battle starts. The closer the enemy is, the higher the DMG they take—up to 1x true DMG.",
        },
        {
          tier: "red",
          skill: "Pulse Nova",
          description:
            "Duration increases by 3s, reduces target's injured Energy Regen by 80%, and Pulse deals 2x damage to Warrior-class heroes",
        },
        {
          tier: "rainbow",
          name: "Agonizing Rend",
          description:
            "When taking a single hit that exceeds 9% of max HP, rips the ground beneath the attacker, stunning them for 3s as a counter. While stunned, the target cannot recover energy. CD: 7s",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Pulse Nova",
        unlockStars: 0,
        iconUrl: talent("jungle-envoy", "pulse-nova"),
        description:
          "Summons Pulse Nova, dealing 38% of ATK as magic DMG per second to all enemies for 7s (cannot be dispelled, ends upon death, reactivating refreshes duration).",
      },
      {
        kind: "battle",
        name: "Lightning Storm",
        unlockStars: 2,
        iconUrl: talent("jungle-envoy", "lightning-storm"),
        description:
          "Every 7s, summons a lightning storm above the 2 frontmost enemies, dealing magic DMG equal to 160% of own ATK and knocking them back.",
      },
      {
        kind: "enhance",
        name: "Enhanced Pulse",
        unlockStars: 5,
        iconUrl: talent("jungle-envoy", "enhanced-pulse"),
        description: "Pulse Nova: Increases magic DMG dealt by pulses by 10%",
      },
      {
        kind: "special",
        name: "Demonic Edict",
        unlockStars: 8,
        iconUrl: talent("jungle-envoy", "demonic-edict"),
        description:
          "9s after the battle begins, triggers a 4s magic explosion that deals true DMG equal to 55% of own ATK per second to a random enemy. Cooldown: 11s.",
      },
      {
        kind: "passive",
        name: "Jungle Warden",
        unlockStars: 12,
        iconUrl: talent("jungle-envoy", "jungle-warden"),
        description: "HP increased by 25%",
      },
      {
        kind: "enhance",
        name: "Power Surge",
        unlockStars: 16,
        iconUrl: talent("jungle-envoy", "power-surge"),
        description:
          "Lightning Storm: Immediately casts a Lightning Storm upon entering battle. The intense current numbs the target, reducing target's knockback effect by 30% for 3s",
      },
    ],
    cores: [
      {
        name: "Wizard's Wand",
        skill: "Pulse Nova",
        description: "Pulse Nova: Pulses inflict a 30% Heavy Injury Effect",
      },
      {
        name: "Arcane Hat",
        skill: "Lightning Storm",
        description: "Lightning Storm: ATK's Magic DMG increased by 30%(90%)",
      },
      {
        name: "Mage Robe",
        skill: "Enhanced Pulse",
        description:
          "Enhanced Pulse: pulses deal additional Magic DMG equal to 12% of ATK",
      },
      {
        name: "Spell Tome",
        skill: "Demonic Edict",
        // This core description uses a different name for Demonic Edict.
        description: "Demon's Decree reduces subsequent cooldown by 3 s",
      },
    ],
    divinities: ["magic-dmg-boost", "knockback-effect"],
  },
  "radiant-paladin": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Sacred Body",
        description:
          "For every loss of 10% max HP, increases self Physical RES by 3% and Injured Energy Regen effect by 3.5%",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.33.58\u202fAM.png",
      },
      {
        stage: "III",
        name: "Wings of Purity",
        description:
          "Upon HP first dropping below 40%, immune to Physical DMG for 4s and restores 5% max HP per second",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.34.00\u202fAM.png",
      },
    ],
    artifact: {
      name: "Sacred Book",
      iconUrl: "/artifacts/radiant-paladin.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Sanctity Hammer",
          description: "Converts 70% of DMG dealt to enemies into self-healing",
        },
        {
          tier: "gold",
          skill: "Purifying Light",
          description: "Reduces the intervals of release by 25%",
        },
        {
          tier: "red",
          skill: "Guardian of Light",
          description:
            "Duration increased by 3s, clearing all debuffs upon activation",
        },
        {
          tier: "rainbow",
          name: "Sanctuary Guardian",
          description:
            "Upon entering the battlefield, reduce all enemies' ATK SPD by 20% and MOV SPD by 10%. Applies 1 Guardian of Light to the weakest allied hero every 10s",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Guardian of Light",
        unlockStars: 0,
        iconUrl: talent("radiant-paladin", "guardian-of-light"),
        description:
          "Summon the power of light to protect all friendly units, increasing DEF by 30% for 4 s",
      },
      {
        kind: "battle",
        name: "Sanctity Hammer",
        unlockStars: 2,
        iconUrl: talent("radiant-paladin", "sanctity-hammer"),
        description:
          "Basic ATK have a 50% chance to deal 120% True DMG to the target with a knockback effect",
      },
      {
        kind: "enhance",
        name: "Illumination",
        unlockStars: 5,
        iconUrl: talent("radiant-paladin", "illumination"),
        description:
          "During Guardian of Light, Energy Regen SPD increases by 10%",
      },
      {
        kind: "passive",
        name: "Purifying Light",
        unlockStars: 8,
        iconUrl: talent("radiant-paladin", "purifying-light"),
        description: "Every 8s, remove debuffs from 2 allied heroes",
      },
      {
        kind: "attribute",
        name: "Sacred Incarnate",
        unlockStars: 12,
        iconUrl: talent("radiant-paladin", "sacred-incarnate"),
        description: "Magic RES increased by 10%, and HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Divine Guardian",
        unlockStars: 16,
        iconUrl: talent("radiant-paladin", "divine-guardian"),
        description:
          "During Guardian of Light, restore Radiant Paladin's HP equal to 35% of its ATK per second",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Sanctity Hammer",
        description: "Sanctity Hammer trigger chance increased by 10%(30%)",
      },
      {
        name: "Tome of Radiance",
        skill: "Illumination",
        description:
          "Illumination additionally increases Energy Regen speed by 2%(6%)",
      },
      {
        name: "Luminous Visor",
        skill: "Purifying Light",
        description:
          "Purifying Light additionally heals allies for 30%(100%) of Attack as HP",
      },
      {
        name: "Resonance Pendant",
        skill: "Divine Guardian",
        description:
          "Divine Guardian additionally heals the Radiant Paladin for 15%(45%) of Attack as HP per second",
      },
    ],
    divinities: ["physical-res", "anti-control-rate"],
  },
  "holy-healer": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Eudaemon Blessing",
        description:
          "When enemies cast energy skills, applies a shield equal to Holy Healer's 200% ATK to the weakest ally (Cooldown: 12s)",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.37.31\u202fAM.png",
      },
      {
        stage: "III",
        name: "Conviction",
        description:
          "Every 8s during battle, reduces the Energy Regen SPD of the enemy with the highest accumulated damage by 55% for 5s",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.37.33\u202fAM.png",
      },
    ],
    artifact: {
      name: "Recover Staff",
      iconUrl: "/artifacts/holy-healer.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Darkness Land",
          // The artifact calls this talent Darkness Forbidden Land.
          description:
            "Darkness Forbidden Land: Reduces the MOV SPD of enemies within range by 50%",
        },
        {
          tier: "gold",
          skill: "Meteor Falls",
          description: "Increases DMG range by 30%, meteor count +2",
        },
        {
          tier: "red",
          skill: "Meteor Falls",
          description:
            "Increases DEF of allied heroes hit by the meteor by 20%. Decreases the ATK of enemies hit by the meteor by 15%, lasting for 6s.",
        },
        {
          tier: "rainbow",
          name: "Starry Salvation",
          description:
            "Heals the weakest allied hero periodically with HP equal to 320% of Holy Healer’s ATK, and increase DMG Reduction by 20% within 8s",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Darkness Land",
        unlockStars: 0,
        iconUrl: talent("holy-healer", "darkness-land"),
        description:
          'Place a Forbidden Land in the front, lasting for 3s. Enemies entering the Forbidden Land will be silenced and lose 50 Energy per second. When the "Forbidden Land" disappears, enemies within range will be stunned for 2.5s.',
      },
      {
        kind: "enhance",
        name: "Darkness Strike",
        unlockStars: 2,
        iconUrl: talent("holy-healer", "darkness-strike"),
        description:
          "Darkness Forbidden Land: Enemies within range will receive Magic DMG equal to 70% of ATK per second from the Holy Healer",
      },
      {
        kind: "enhance",
        name: "Darkness Befalls",
        unlockStars: 5,
        iconUrl: talent("holy-healer", "darkness-befalls"),
        description: "Darkness Forbidden Land: Extends the duration by 2s",
      },
      {
        kind: "special",
        name: "Meteor Falls",
        unlockStars: 8,
        iconUrl: talent("holy-healer", "meteor-falls"),
        description:
          "At set intervals, 3 meteor(s) will be summoned, dealing Magic DMG equal to 50% of ATK to enemies while restoring HP to allied heroes within range equal to 80% of Holy Healer's ATK",
      },
      {
        kind: "attribute",
        name: "ATK Amplification",
        unlockStars: 12,
        iconUrl: talent("holy-healer", "atk-amplification"),
        description: "Increases ATK by 25%",
      },
      {
        kind: "enhance",
        name: "Darkest Hour",
        unlockStars: 16,
        iconUrl: talent("holy-healer", "darkest-hour"),
        description:
          "Darkness Forbidden Land: Increases the DMG range by 30% and extends the stun effect by 1.5s",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Darkness Land",
        description:
          "Darkness Land additionally drains 2%(6%) of Current HP per second (up to a maximum of 30%(90%) of the Holy Healer's Attack)",
      },
      {
        name: "Tome of Radiance",
        skill: "Darkness Strike",
        description:
          "Darkness Strike additionally inflicts Magic DMG equal to 15%(45%) of Attack per second",
      },
      {
        name: "Luminous Visor",
        skill: "Meteor Falls",
        description:
          "Meteor Falls additionally restores 20%(60%) of Attack as HP",
      },
      {
        name: "Resonance Pendant",
        skill: "Darkest Hour",
        description:
          "Darkest Hour reduces the Magic RES of enemies within the Darkness Land by 10%(30%)",
      },
    ],
    divinities: ["support-atk", "melee-dmg-boost"],
  },
  silence: {
    awakeningSkills: [
      {
        stage: "I",
        name: "Blade Break",
        description:
          "Wisdom Blade has a 40% chance to damage 2 enemies in front. The same target attacked 4 times will reduce their DEF by 10% for 5s",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.34.28\u202fAM.png",
      },
      {
        stage: "III",
        name: "Soul Sustenance",
        description:
          "For each fallen 1 allies on the battlefield, increases self ATK by 4.5% and DEF by 4.5%, effects last until the end of battle",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.34.29\u202fAM.png",
      },
    ],
    artifact: {
      name: "Blood Knight",
      iconUrl: "/artifacts/silence.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Wisdom Blade",
          description: "Reduces 60 Energy from targets hit.",
        },
        {
          tier: "gold",
          skill: "Magic Curse",
          description: "Increases the Magic ATK DMG dealt by 120%",
        },
        {
          tier: "red",
          skill: "Silence Domain",
          description:
            "Silences a target and deals Magic DMG equal to 70% of ATK per second, decreasing MOV SPD by 30% during this period",
        },
        {
          tier: "rainbow",
          name: "Silent Sensing",
          // The scrolled 11.34.46 capture completes the ability description.
          description:
            "Periodically targets an enemy with the highest Energy in range and releases a small-scaled mysterious curse. Deals Magic DMG equal to 100% of ATK and deducts 30 energy per second, lasting for 5s",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Silence Domain",
        unlockStars: 0,
        iconUrl: talent("silence", "silence-domain"),
        // The complete 11.34.40 text supplies no duration unit after "4".
        description:
          "Silences all enemy heroes for 4 and only allows Basic ATK.",
      },
      {
        kind: "special",
        name: "Wisdom Blade",
        unlockStars: 2,
        iconUrl: talent("silence", "wisdom-blade"),
        description:
          "Normal attacks burn with extra potency, dealing an additional 35% of Attack as True Damage.",
      },
      {
        kind: "enhance",
        name: "ATK Reduction",
        unlockStars: 5,
        iconUrl: talent("silence", "atk-reduction"),
        description:
          "Silence Domain Decreases the ATK of affected enemies by 12% within 6s",
      },
      {
        kind: "battle",
        name: "Magic Curse",
        unlockStars: 8,
        iconUrl: talent("silence", "magic-curse"),
        description:
          "When an enemy releases an Energy skill, it will deal a Magic DMG equal to 150% of ATK to the caster and prevent the caster from recovering Energy for 2s",
      },
      {
        kind: "attribute",
        name: "Arcane Enhanced",
        unlockStars: 12,
        iconUrl: talent("silence", "arcane-enhanced"),
        description: "Energy Regen SPD increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Energy Drain",
        unlockStars: 16,
        iconUrl: talent("silence", "energy-drain"),
        description:
          "Silence Domain: When released, immediately deduct 100 Energy points from all affected enemies",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Wisdom Blade",
        description: "Wisdom Blade increases True DMG by 15%(45%) of Attack",
      },
      {
        name: "Tome of Radiance",
        skill: "ATK Reduction",
        description: "ATK Reduction extends the duration by 0.5(1.5) s",
      },
      {
        name: "Luminous Visor",
        skill: "Magic Curse",
        description:
          "Magic Curse inflicts additional Magic DMG equal to 40%(120%) of Attack",
      },
      {
        name: "Resonance Pendant",
        skill: "Energy Drain",
        description:
          "Energy Drain drains an additional 15(45) points of energy",
      },
    ],
    divinities: ["support-atk", "magic-dmg-boost"],
  },
  gunslinger: {
    awakeningSkills: [
      {
        stage: "I",
        name: "Swift Victory",
        description:
          "Upon entering battle, increases self Energy Recovery SPD by 40% for 25s, gradually diminishing over time",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.34.51\u202fAM.png",
      },
      {
        stage: "III",
        name: "Frenzy",
        description:
          "Each time Snipe is cast, increases self ATK by 10% and ATK SPD by 10%. This effect lasts until the end of the battle (up to 2 stacks)",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.34.53\u202fAM.png",
      },
    ],
    artifact: {
      name: "Flame-red Robe",
      iconUrl: "/artifacts/gunslinger.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Shotgun",
          description:
            "Increases the DMG range by 50%, increasing the Physical DMG dealt by 100%.",
        },
        {
          tier: "gold",
          // This gold-tier ability is standalone in the 11.35.15 popup.
          name: "Full-out Shooting",
          description:
            "Upon entering the battlefield, increases CRIT Rate by 20% and Knockback Effect by 50% within 12s.",
        },
        {
          tier: "red",
          skill: "Snipe",
          description: "Deals 1.1~1.4 times DMG randomly to the target",
        },
        {
          tier: "rainbow",
          skill: "Snipe",
          description:
            "Upon defeating the target, gains an additional 300 points of Energy.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Snipe",
        unlockStars: 0,
        iconUrl: talent("gunslinger", "snipe"),
        description:
          "Snipe the furthest enemy, dealing Physical DMG equal to 820% of ATK, with a stun effect lasting for 1.5s. The DMG dealt by Snipe will not replenish Energy for the enemy",
      },
      {
        kind: "special",
        name: "Shotgun",
        unlockStars: 2,
        iconUrl: talent("gunslinger", "shotgun"),
        description:
          "Fires the Shotgun once in a set interval, dealing 100% Physical DMG to enemies in range. Decreases the MOV SPD of enemies hit by the Shotgun by 80%. The speed reduction effect will diminish over time",
      },
      {
        kind: "enhance",
        name: "Quick Snipe",
        unlockStars: 5,
        iconUrl: talent("gunslinger", "quick-snipe"),
        description: "Snipe Reduces the Energy needed for each shot by 25%",
      },
      {
        kind: "battle",
        name: "Headshot",
        unlockStars: 8,
        iconUrl: talent("gunslinger", "headshot"),
        description:
          "Normal attacks have a 70% chance to land a crushing blow, dealing an extra 50% of Attack as Physical DMG, briefly stunning the target, and increasing the Knockback Effect by 40%.",
      },
      {
        kind: "attribute",
        name: "Aim",
        unlockStars: 12,
        iconUrl: talent("gunslinger", "aim"),
        description: "Increase ATK SPD by 15%, and CRIT Rate by 10%",
      },
      {
        kind: "enhance",
        name: "Enhance Snipe",
        unlockStars: 16,
        iconUrl: talent("gunslinger", "enhance-snipe"),
        description:
          "Snipe extends its stun duration by 1.5 seconds. If the target's HP is above 60%, it deals an additional 25% Damage.",
      },
    ],
    cores: [
      {
        name: "Arrow Core",
        skill: "Shotgun",
        // The scrolled 11.35.00 capture completes the Arrow Core panel.
        description:
          "Shotgun increases the Physical DMG of your Attack by 150%(450%)",
      },
      {
        name: "Hunter's Cloak",
        skill: "Headshot",
        description: "Headshot increases Stun Time by 0.3(1) s",
      },
      {
        name: "Crystal Pendant",
        skill: "Enhance Snipe",
        description:
          "Enhance Snipe lowers the HP threshold required to deal extra DMG by 20%(60%)",
      },
      {
        name: "Swift Longbow",
        skill: "Snipe",
        // This fourth panel is visible in the scrolled 11.35.10 capture.
        description:
          "Snipe reduces the Attack of the Snipe Target by 10%(30%) for 8 s",
      },
    ],
    divinities: ["ranged-dmg-reduction", "crit-damage"],
  },
  "silver-warrior": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Lone And Brave",
        description:
          "When HP first drops below 50%, gain immunity to certain control and slow effects for 7.5s",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.36.52\u202fAM.png",
      },
      {
        stage: "III",
        name: "Killing Intent",
        description:
          "The final strike of Godslayer Strike stuns the enemy for 4s and reduces the cooldown of Dawn Slash by 1.5s",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.36.54\u202fAM.png",
      },
    ],
    artifact: {
      name: "Gunblade",
      iconUrl: "/artifacts/silver-warrior.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Dawn Slash",
          description:
            "The sword slash has a 35% chance to deal True DMG to the enemy",
        },
        {
          tier: "gold",
          skill: "Adrenaline",
          description:
            "Duration increased by 1s. Stuns all enemies for 1s when skill activated",
        },
        {
          tier: "red",
          skill: "Godslayer Strike",
          description:
            "Each time this skill is cast, instantly restores 30% of lost HP and reduce damage taken by 18% for the next 6s",
        },
        {
          tier: "rainbow",
          name: "Potential Unleashed",
          description:
            "For every 6% of maximum HP lost, permanently increase self DEF by 2.5% and Armor PEN by 2.5% (up to 15 stacks)",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Godslayer Strike",
        unlockStars: 0,
        iconUrl: talent("silver-warrior", "godslayer-strike"),
        description:
          "Splits the weapon into 5 secondary blades of different forms. All secondary blades will lock onto and attack the foremost one enemy, dealing Physical DMG equal to 300% of ATK per blade",
      },
      {
        kind: "battle",
        name: "Dawn Slash",
        unlockStars: 2,
        iconUrl: talent("silver-warrior", "dawn-slash"),
        description:
          "Every 8s, unleash a sword slash forward, dealing Physical DMG equal to 280% of ATK to up to 3 enemies in front. With each enemy hit, both the damage and knockback effects of the sword slash increase by 20%",
      },
      {
        kind: "enhance",
        name: "Mad Blade",
        unlockStars: 5,
        iconUrl: talent("silver-warrior", "mad-blade"),
        description:
          "Godslayer Strike Physical DMG dealt by each secondary blade increases by 80%",
      },
      {
        kind: "special",
        name: "Adrenaline",
        unlockStars: 8,
        iconUrl: talent("silver-warrior", "adrenaline"),
        description:
          "When HP first drops below 40%, restores 15% of lost HP per second for 5s",
      },
      {
        kind: "attribute",
        name: "Energy Armor",
        unlockStars: 12,
        iconUrl: talent("silver-warrior", "energy-armor"),
        description: "HP increased by 15%, ATK increased by 10%",
      },
      {
        kind: "enhance",
        name: "Annihilation Blade",
        unlockStars: 16,
        iconUrl: talent("silver-warrior", "annihilation-blade"),
        description:
          "Godslayer Strike: The final blow from the secondary sword inflicts an extra 300% True Damage and weakens the enemy, reducing their DEF by 20% and Attack by 10% for 6 seconds.",
      },
    ],
    cores: [
      {
        name: "Cavalier Helm",
        skill: "Dawn Slash",
        description: "Dawn Slash adds 50%(150%) of Attack as additional DMG",
      },
      {
        name: "Brawler's Armor",
        skill: "Adrenaline",
        description:
          "Adrenaline additionally restores 6%(18%) of lost HP per second",
      },
      {
        name: "Brawler's Boots",
        skill: "Annihilation Blade",
        // The core calls its containing talent "Blade of Destruction".
        description:
          "Blade of Destruction adds 80%(240%) of Attack as additional True DMG",
      },
      {
        name: "Blade of Valor",
        skill: "Godslayer Strike",
        // The scrolled 11.37.18 capture completes the core description.
        description:
          "Godslayer Strike adds 60%(180%) of Attack as additional Physical DMG",
      },
    ],
    divinities: ["atk", "melee-dmg-reduction"],
  },
  "dark-knight": {
    // Owner screenshots: 2026-09-13 11.35.22–11.35.46 AM, including scrolled duplicates.
    awakeningSkills: [
      {
        stage: "I",
        name: "Undead Guard",
        // The final node says "Undead Guard"; its description says "Undead Guardian".
        description:
          '"Undead Guardian" Upon entering battle, increases all allies\' Magic RES by 10%',
        sourceScreenshot: "Screenshot 2026-09-13 at 11.35.22\u202fAM.png",
      },
      {
        stage: "III",
        name: "Death Pact",
        description:
          "Upon receiving fatal damage, dies after 3.5s (during which cannot recover energy)",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.35.24\u202fAM.png",
      },
    ],
    artifact: {
      name: "Sorrow Frost",
      iconUrl: "/artifacts/dark-knight.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Entangle",
          description: "Entangle DMG and Healing effects increased by 10%",
        },
        {
          tier: "gold",
          // The gold tier introduces a standalone ability, not a talent bonus.
          name: "Frost Dark Axe",
          description:
            "Basic ATK reduce the target's MOV SPD by 5% (stackable), lasting 15s. The same target will be silenced for 3s after being attacked 3 times, and loses HP equal to 30% of the Dark Knight's ATK per second.",
        },
        {
          tier: "red",
          skill: "Gloomy Shield",
          description:
            "The release intervals reduced 2.5s. Shield explodes upon its disappearance, dealing Physical DMG equal to 300% of ATK to nearby enemy units with a knockback effect",
        },
        {
          tier: "rainbow",
          name: "Evil Aura",
          description:
            "Upon entering the battlefield, increases the MOV SPD of all allied heroes by 8% and restores HP equal to 10% of the Dark Knight's ATK per second. Allied heroes with less than 35% HP receive an additional 50% healing effect.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Darklight Shield",
        unlockStars: 0,
        iconUrl: talent("dark-knight", "darklight-shield"),
        description:
          "Immediately dispel all debuffs on yourself and apply a Darklight Shield, capable of absorbing DMG equal to 8% of the Dark Knight's HP and converting it into HP (affected by Heavy Injury Effect), lasting for 7s",
      },
      {
        kind: "battle",
        name: "Entangle",
        unlockStars: 2,
        iconUrl: talent("dark-knight", "entangle"),
        description:
          "Attacks have a 25% chance to unleash Death Entangle on the weakest target on the battlefield. If the target is an enemy, it deals True DMG equal to 220% of the ATK. If the target is an ally, it restores HP equal to 220% of the Dark Knight's ATK",
      },
      {
        kind: "enhance",
        name: "Charge",
        unlockStars: 5,
        iconUrl: talent("dark-knight", "charge"),
        description: "Darklight Shield HP conversion increased by 3%",
      },
      {
        kind: "special",
        name: "Gloomy Shield",
        unlockStars: 8,
        iconUrl: talent("dark-knight", "gloomy-shield"),
        description:
          "When self or allied heroes are affected by control-type debuffs (stun, silence, freeze, bound), instantly apply a Gloomy Shield lasting 5s, capable of absorbing DMG equal to 150% of the Dark Knight's ATK and removing debuffs. Can be cast again every 8s",
      },
      {
        kind: "attribute",
        name: "Dark Bloodline",
        unlockStars: 12,
        iconUrl: talent("dark-knight", "dark-bloodline"),
        description: "Knockback Resist increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Undead",
        unlockStars: 16,
        iconUrl: talent("dark-knight", "undead"),
        description:
          "Darklight Shield effect also applies to all other allied heroes, capable of absorbing DMG equal to 5% of the Dark Knight's HP and converting it into their own HP (unaffected by Heavy Injury Effect). Additionally, increases SPD Reduction RES by 20% during the effect. Passive: When the Dark Knight's HP first drops below 30%, immediately cast this skill without consuming energy",
      },
    ],
    cores: [
      {
        name: "Cavalier Helm",
        skill: "Entangle",
        description: "Entangle DMG and healing effect are boosted by 20%(60%).",
      },
      {
        name: "Brawler's Armor",
        skill: "Gloomy Shield",
        description:
          "Gloomy Shield additionally absorbs DMG equal to 50%(150%) of Attack.",
      },
      {
        name: "Brawler's Boots",
        skill: "Undead",
        description:
          "Undead further increases the Life Shield value granted to allies by 1.5%(4.5%).",
      },
      {
        name: "Blade of Valor",
        skill: "Darklight Shield",
        description:
          "Darklight Shield additionally increases its absorbable HP by 1%(3%)",
      },
    ],
    divinities: ["receive-healing", "dmg-reduction"],
  },
  "arcane-saint": {
    // Owner screenshots: 2026-09-13 11.35.50–11.36.14 AM.
    awakeningSkills: [
      {
        stage: "I",
        name: "Gourd Guard",
        description:
          "Upon entering battle, protects the allied hero with the lowest DEF, increasing their Energy gain from damage taken by 80% (effect ends when this unit dies).",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.35.52\u202fAM.png",
      },
      {
        stage: "III",
        name: "Nature's Power",
        description:
          "Increases all allies' 8% Physical RES and 8% Magic RES each time Golden Holy Bloom is cast (up to a maximum of 2 stacks)",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.35.55\u202fAM.png",
      },
    ],
    artifact: {
      name: "Starshine Staff",
      iconUrl: "/artifacts/arcane-saint.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Sage's Gift",
          description:
            "Sage's Gift has a 50% chance to cleanse some negative effects from allies each time it is cast",
        },
        {
          tier: "gold",
          skill: "Unified",
          description:
            "Unified duration is extended by 8s and additionally increases all allies' 15% Anti-CRIT Rate",
        },
        {
          tier: "red",
          skill: "Golden Holy Bloom",
          description:
            "Golden Holy Bloom increases all allies' MOV SPD by 25% and Energy Regen SPD by 38% after activation, with the effect lasting for 6s",
        },
        {
          tier: "rainbow",
          name: "Summon Beast",
          description:
            "Enters battle and summons two beasts every 16s to assist. Pangolin: Significantly knocks back the enemy at the front and reduces healing received by the enemy by 80% for 8s. Lark: Restores 10% of max HP and 100 energy yourself.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Golden Holy Bloom",
        unlockStars: 0,
        iconUrl: talent("arcane-saint", "golden-holy-bloom"),
        description:
          "Summon Golden Holy Bloom to heal all allies for 180% of ATK over 4s, while reducing all enemies' ATK by 8% for 6s",
      },
      {
        kind: "battle",
        name: "Sage's Gift",
        unlockStars: 2,
        iconUrl: talent("arcane-saint", "sage-s-gift"),
        description:
          "Basic ATK have a 30% chance to throw a Holy Bloom to the weakest ally, restoring 150% of their ATK as HP",
      },
      {
        kind: "enhance",
        name: "Energy Penalty",
        unlockStars: 5,
        iconUrl: talent("arcane-saint", "energy-penalty"),
        description:
          "Golden Holy Bloom reduces the energy recovery SPD of the enemy with the highest total DMG dealt by 80% after activation, with the effect lasting for 7s",
      },
      {
        kind: "special",
        name: "Unified",
        unlockStars: 8,
        iconUrl: talent("arcane-saint", "unified"),
        description:
          "Upon entering battle, increase all allies' ATK by 12% and DEF by 12% within 20s",
      },
      {
        kind: "passive",
        name: "Vigorous",
        unlockStars: 12,
        iconUrl: talent("arcane-saint", "vigorous"),
        description: "ATK increased by 10%, HP increased by 15%",
      },
      {
        kind: "enhance",
        name: "Guard Bloom",
        unlockStars: 16,
        iconUrl: talent("arcane-saint", "guard-bloom"),
        description:
          "Golden Holy Bloom Also heals the allied hero with the lowest HP for 30% of lost HP, and grants 20% DMG Reduction for 5s.",
      },
    ],
    cores: [
      {
        name: "Tome of Radiance",
        skill: "Sage's Gift",
        description:
          "Sage's Gift has its activation chance increased by 5%(15%)",
      },
      {
        name: "Luminous Visor",
        skill: "Unified",
        description: "Unified additionally increases Attack and DEF by 1%(3%)",
      },
      {
        name: "Resonance Pendant",
        skill: "Guard Bloom",
        description: "Guard Bloom additionally restores 5%(15%) of lost HP",
      },
      {
        name: "Crystal Staff",
        skill: "Golden Holy Bloom",
        description:
          "Golden Holy Bloom additionally heals for 10%(30%) of Attack as HP",
      },
    ],
    divinities: ["def", "hp"],
  },
  // Dark Faded combines 11.50.20 and its inner-panel scroll at 11.51.47 AM.
  "witch-dictator": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Dark Faded",
        description:
          "The presence of the Witch Dictator instills fear in enemies, increasing all Magic DMG they take by 5%. Additionally, the Witch Dictator's Basic ATKs have a 30% chance to freeze enemies for 1.5s. Passive: All of the Witch Dictator's freeze effects reduce the enemy's energy by 30 (CD: 3 s)",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.51.47\u202fAM.png",
      },
      {
        stage: "III",
        name: "Dark Ritual",
        description:
          "Upon entering battle, consumes 3% of current maximum HP and convert into 100 energy (cooldown: 10 s, cannot be activated if HP is below 30%)",
        sourceScreenshot: "Screenshot 2026-09-13 at 11.36.22\u202fAM.png",
      },
    ],
    artifact: {
      name: "Mana Potion",
      iconUrl: "/artifacts/witch-dictator.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Frigid Explosion",
          description:
            "Explosion range increased by 50%, and the slowing effect duration is increased by 3s.",
        },
        {
          tier: "gold",
          skill: "Frost Armor",
          description:
            "Also casts an equivalent Frost Armor on itself. When a protected hero is attacked, the attacker's ATK SPD is reduced by 30% for 3s.",
        },
        {
          tier: "red",
          name: "Withering Fear",
          description:
            "The Witch Dictator strikes fear into his enemies. Increases all enemy Heavy Injury Effect by 50%",
        },
        {
          tier: "rainbow",
          skill: "Frost Echo",
          description:
            "Damage radius increased by 30%, and targets hit have a 75% chance to be frozen for 1.5s.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Frost Echo",
        unlockStars: 0,
        iconUrl: talent("witch-dictator", "frost-echo"),
        description:
          "Summon a Frost Nova that bounces between enemies 5 times and creates a small area explosion, dealing Magic DMG equal to 100% of ATK each time",
      },
      {
        kind: "battle",
        name: "Frigid Explosion",
        unlockStars: 2,
        iconUrl: talent("witch-dictator", "frigid-explosion"),
        description:
          "Basic ATK have a 35% chance to create a Frigid Explosion, dealing Magic DMG equal to 35% of ATK to the target. The explosion deals Magic DMG equal to 150% of ATK to surrounding targets and reduces their MOV SPD by 30% for 2s",
      },
      {
        kind: "enhance",
        name: "Ultimate Frost",
        unlockStars: 5,
        iconUrl: talent("witch-dictator", "ultimate-frost"),
        description:
          "Frost Echo decreases the ATK SPD by 35% and MOV SPD by 50% for 3s of hitting the target.",
      },
      {
        kind: "special",
        name: "Frost Armor",
        unlockStars: 8,
        iconUrl: talent("witch-dictator", "frost-armor"),
        description:
          "At set intervals, create a Frost Armor that lasts 8s for the most vulnerable allied hero, increasing their DMG Reduction by 15% and recovers 1% of their Max HP per second.",
      },
      {
        kind: "attribute",
        name: "ATK Amplification",
        unlockStars: 12,
        iconUrl: talent("witch-dictator", "atk-amplification"),
        description: "Increases ATK by 25%",
      },
      {
        kind: "enhance",
        name: "Multifrost",
        unlockStars: 16,
        iconUrl: talent("witch-dictator", "multifrost"),
        description:
          "Frost Echo Shooting Count of released Chain Frost New Star Bullets +3",
      },
    ],
    cores: [
      {
        name: "Arcane Hat",
        skill: "Frigid Explosion",
        description:
          "「Frigid Explosion」 now inflicts additional Magic DMG against the primary target equal to 50%(150%) of ATK, and against surrounding enemies equal to 12%(36%) of ATK",
      },
      {
        name: "Mage Robe",
        skill: "Ultimate Frost",
        description: "「Ultimate Frost」 Slow duration extended by 1(3) s",
      },
      {
        name: "Spell Tome",
        skill: "Frost Armor",
        description:
          "「Frost Armor」 DMG Reduction increased by 5%(15%), Max HP Recovery per second increased by 0.3%(1%)",
      },
      {
        name: "Wizard's Wand",
        skill: "Frost Echo",
        description:
          "「Frost Echo」 now inflicts additional Magic DMG equal to 8%(24%) of ATK",
      },
    ],
    divinities: ["magic-dmg-boost", "magic-res"],
  },
  thrall: {
    awakeningSkills: [
      {
        stage: "I",
        name: "Kinetic Field",
        description:
          "While Thrall is alive, all enemies (excluding illusions and summons) have their movement speed reduced by 10% and control resistance reduced by 30%.",
        sourceScreenshot: "Screenshot 2026-09-13 at 9.27.26\u202fAM.png",
      },
      {
        stage: "III",
        name: "Guardian Purification",
        // The in-game description spells Thrall as "Thal"; preserve its text.
        description:
          "When casting any skill, randomly dispels some debuffs from one allied hero and restores HP equal to 50% of Thal's ATK every second for 6s (Cooldown: 8s).",
        sourceScreenshot: "Screenshot 2026-09-13 at 9.27.29\u202fAM.png",
      },
    ],
    artifact: {
      name: "Hammer of Destruction",
      iconUrl: "/artifacts/thrall.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Electric storm",
          description:
            "Knockback reduction from the electric storm is increased by 8%.",
        },
        {
          tier: "gold",
          skill: "Thunder Strike",
          description: "Each lightning strike also hits one additional enemy.",
        },
        {
          tier: "red",
          skill: "Guardian Rune",
          description:
            "When applying a Guardian Rune to an ally, reduces their DMG taken by 20% for 8 s, and increases the max HP restored when blocking fatal damage by 16%.",
        },
        {
          tier: "rainbow",
          // Both the talent and artifact popups attach this to Thunder Strike.
          skill: "Thunder Strike",
          description:
            "Each lightning strike briefly reduces the enemy's ATK SPD and MOV SPD significantly, and decreases their Energy Regen SPD by 50% per sec for 6s.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Electric storm",
        unlockStars: 0,
        iconUrl: talent("thrall", "electric-storm"),
        description:
          "Creates an unstable electric storm on the battlefield, dealing 100% magic DMG per sec to all enemies and silencing them for 2 s.",
      },
      {
        kind: "battle",
        name: "Thunder Strike",
        unlockStars: 2,
        iconUrl: talent("thrall", "thunder-strike"),
        description:
          "Curses one enemy every 8 s. The cursed enemy will be struck by lightning 3 times over 6 s, each strike dealing 90% true DMG.",
      },
      {
        kind: "enhance",
        name: "Enhanced Storm",
        unlockStars: 5,
        iconUrl: talent("thrall", "enhanced-storm"),
        description:
          "Electric storm: During the storm, all enemies's knockback effects reduced by 12%.",
      },
      {
        kind: "special",
        name: "Guardian Rune",
        unlockStars: 8,
        iconUrl: talent("thrall", "guardian-rune"),
        description:
          "After 6 s in battle, applies a Guardian Rune to the ally with the lowest HP, blocking 1 instances of fatal damage and restoring 20% of their max HP. Each cast increases the CD by 8 s (can be cast up to 2 times per battle, and each ally can only receive the rune once).",
      },
      {
        kind: "passive",
        name: "Orc Soul",
        unlockStars: 12,
        iconUrl: talent("thrall", "orc-soul"),
        description: "Physical RES increased by 10%, HP increased by 15%.",
      },
      {
        kind: "enhance",
        name: "Electric Overload",
        unlockStars: 16,
        iconUrl: talent("thrall", "electric-overload"),
        description:
          "Electric storm: During the electric storm, the lower the target's energy, the more DMG they take, up to an additional 100% DMG. All enemies are stunned for 1 s when the storm ends.",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Electric storm",
        description:
          "Electric Storm additionally reduces all Enemies' HP Regen per second by 1.2%(3.6%).",
      },
      {
        name: "Tome of Radiance",
        skill: "Thunder Strike",
        description:
          "Thunder Strike inflicts True DMG equal to 15%(45%) of Attack.",
      },
      {
        name: "Luminous Visor",
        skill: "Guardian Rune",
        description: "Guardian Rune additionally restores 3%(9%) of Max HP.",
      },
      {
        name: "Resonance Pendant",
        skill: "Electric Overload",
        description:
          "Electric Overload raises the maximum additional DMG taken to 130%(200%).",
      },
    ],
    divinities: ["knockback-effect", "anti-crit-rate"],
  },
  necromancer: {
    awakeningSkills: [
      {
        stage: "I",
        name: "Sadist's Heart",
        description:
          "For every enemy killed (excluding summons), gain 3% Ranged DMG Reduction and 0.3% HP Regen per second, stacking up to 5 times.",
        sourceScreenshot: "Screenshot 2026-09-13 at 9.19.39\u202fAM.png",
      },
      {
        stage: "III",
        name: "Necro Possession",
        // Repeated captures end with "until the end"; preserve that wording.
        description:
          "Upon entering battle, grants the ally with the highest ATK (excluding self) 25% Ranged DMG Reduction. This effect decays to 10% after 15 s and lasts until the end",
        sourceScreenshot: "Screenshot 2026-09-13 at 9.22.05\u202fAM.png",
      },
    ],
    artifact: {
      name: "Ghostlight Bone",
      iconUrl: "/artifacts/necromancer.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Reaper Scythe",
          description: "Enemies hit have their ATK reduced by 10% for 8s.",
        },
        {
          tier: "gold",
          skill: "Ghost Shield",
          description:
            "Ghost Shield is cast once immediately upon entering battle; when cast for the first time, an additional Ghost Shield is applied to the frontmost allied hero.",
        },
        {
          tier: "red",
          skill: "Death Pulse",
          description:
            "Number of pulses +1. When any ally or self HP drops below 35% for the first time, automatically casts Death Pulse without consuming Energy (triggers once per battle).",
        },
        {
          tier: "rainbow",
          name: "Exhaustion Aura",
          // The 9.19.54 popup's Max Quality footer obscures the remaining text.
          description:
            "Releases Exhaustion Aura upon entering battle, reducing all enemies' DMG by 12% and Energy Regen by…",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Death Pulse",
        unlockStars: 0,
        iconUrl: talent("necromancer", "death-pulse"),
        description:
          "Continuously releases 2 pulse waves around self. Each pulse attacks and heals in both the front and rear directions, dealing 65% ATK as magic DMG to all enemies in front with a knockback effect, while restoring HP equal to 65% of Necromancer's ATK to all allies along the path.",
      },
      {
        kind: "battle",
        name: "Reaper Scythe",
        unlockStars: 2,
        iconUrl: talent("necromancer", "reaper-scythe"),
        description:
          "After 3s in battle, throws the Reaper Scythe to strike the enemy with the highest physical ATK, dealing 375% ATK as magic DMG and stunning for 2.5s. CD: 12s.",
      },
      {
        kind: "enhance",
        name: "Dark Pulse",
        unlockStars: 5,
        iconUrl: talent("necromancer", "dark-pulse"),
        description: "Death Pulse DMG increased by 45%.",
      },
      {
        kind: "special",
        name: "Ghost Shield",
        unlockStars: 8,
        iconUrl: talent("necromancer", "ghost-shield"),
        description:
          "Every 13s, grants self a Ghost Shield, increasing HP Regen by 1% per second and Energy Regen SPD per second by 10% for 8s.",
      },
      {
        kind: "passive",
        name: "Soul Offering",
        unlockStars: 12,
        iconUrl: talent("necromancer", "soul-offering"),
        description: "ATK increased by 10%, HP increased by 15%.",
      },
      {
        kind: "enhance",
        name: "Necro Arts",
        unlockStars: 16,
        iconUrl: talent("necromancer", "necro-arts"),
        description:
          "Death Pulse healing effect on allies increased by 25%, enemies hit by the pulse lose 40 Energy.",
      },
    ],
    cores: [
      {
        name: "Crystal Staff",
        skill: "Death Pulse",
        // Source: Screenshot 2026-09-13 at 9.31.17 AM.
        description: "Death Pulse enhances its DMG and Heal by 30% of Attack.",
      },
      {
        name: "Tome of Radiance",
        skill: "Reaper Scythe",
        // The core's text calls the talent "Reaper's Scythe".
        description:
          "Reaper's Scythe inflicts additional Magic DMG equal to 80%(240%) of Attack.",
      },
      {
        name: "Luminous Visor",
        skill: "Ghost Shield",
        // Full core panel: Screenshot 2026-09-13 at 9.21.52 AM.
        description:
          "Ghost Shield further boosts HP Regen by 0.2%(0.6%) and Energy Regen by 2%(6%).",
      },
      {
        name: "Resonance Pendant",
        skill: "Necro Arts",
        description:
          "Necro Arts further amplifies ally recovery effects by 10%(30%).",
      },
    ],
    divinities: ["healing-effect", "crit-dmg-reduction"],
  },
  "shadow-fiend": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Soul Reaping",
        description:
          "For every hero that dies, instantly recover 100 energy and gain 30% ATK SPD for 6s (cannot stack but refresh the duration upon each trigger).",
        sourceScreenshot: "Screenshot 2026-09-13 at 8.54.42\u202fAM.png",
      },
      {
        stage: "III",
        name: "Soul Borrowing",
        description:
          "For every enemy on the battlefield, gain an additional 2.5% ATK SPD and 2.5% ATK.",
        sourceScreenshot: "Screenshot 2026-09-13 at 8.54.44\u202fAM.png",
      },
    ],
    artifact: {
      name: "Soul Mask",
      iconUrl: "/artifacts/shadow-fiend.png",
      // Only talent-popup bonuses are available; the rainbow tier is unrecorded.
      bonuses: [
        {
          tier: "purple",
          skill: "Soul Burn",
          description:
            "Each Basic ATK and Skill Cast increases ATK by 0.6% (up to 15 stacks).",
        },
        {
          tier: "gold",
          skill: "Destructive Gloom",
          description:
            "Enemies hit by Shadow are stunned for 1s, and 14% of the DMG dealt is converted to the Shadow Fiend's HP.",
        },
        {
          tier: "red",
          skill: "Destructive Gloom",
          // Completed by the owner's scrolled gameplay/talents/image copy.png.
          description:
            "Immediately releases Destructive Gloom once upon entering battle. Physical DMG from Shadow increases by 90%.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Soul Requiem",
        unlockStars: 0,
        iconUrl: talent("shadow-fiend", "soul-requiem"),
        description:
          "Unleashes ghost to deal Physical DMG equal to 250% of ATK to all enemies. Enemies near the Shadow Fiend take 2 times the damage.",
      },
      {
        kind: "battle",
        name: "Soul Burn",
        unlockStars: 2,
        iconUrl: talent("shadow-fiend", "soul-burn"),
        description:
          "Each Basic ATK and Skill Cast increases ATK SPD by 3% (up to 15 stacks).",
      },
      {
        kind: "enhance",
        name: "Ghost Curse",
        unlockStars: 5,
        iconUrl: talent("shadow-fiend", "ghost-curse"),
        description:
          '"Soul Requiem" Ghost striking enemies reduce their Physical RES by 15% and Magic RES by 15% for 6s.',
      },
      {
        kind: "special",
        name: "Destructive Gloom",
        unlockStars: 8,
        iconUrl: talent("shadow-fiend", "destructive-gloom"),
        description:
          "Every 8s, unleashes 3 waves of shadow across a forward area of 200/350/500 yards. Each wave deals 180% Physical DMG to enemies within a medium range.",
      },
      {
        kind: "passive",
        name: "Haunted",
        unlockStars: 12,
        iconUrl: talent("shadow-fiend", "haunted"),
        description: "Armor PEN increased by 10%, ATK increased by 15%.",
      },
      {
        kind: "enhance",
        name: "Spiteful Curse",
        unlockStars: 16,
        iconUrl: talent("shadow-fiend", "spiteful-curse"),
        description:
          '"Soul Requiem" Physical DMG dealt by Ghost is increased by 80%, and Shadow Fiend releases Soul Requiem upon death.',
      },
    ],
    cores: [
      {
        name: "Swift Longbow",
        skill: "Soul Requiem",
        description: "Soul Requiem increases Attack's Physical DMG by 60%.",
      },
      {
        // The popup says "Arrow Core·Core"; only the final UI suffix is removed.
        name: "Arrow Core",
        skill: "Soul Burn",
        description: "Soul Burn additionally increases ATK SPD by 0.5%(1.5%).",
      },
      {
        name: "Hunter's Cloak",
        skill: "Ghost Curse",
        description:
          "Ghost Curse duration increased by 1 (3) s, and additionally reduces Enemies' Ranged DMG Boost by 5%(15%).",
      },
      {
        // The scrolled gameplay/talents/image copy.png shows the full panel.
        name: "Crystal Pendant",
        skill: "Destructive Gloom",
        description:
          "After each cast of Destructive Gloom, gain 6% DMG Reduction for 10 s, with a 100% chance to purge all negative effects from yourself.",
      },
    ],
    divinities: ["physical-dmg-boost", "crit-damage"],
  },
  "sea-captain": {
    awakeningSkills: [
      {
        stage: "I",
        name: "Commander",
        description:
          "At the start of battle, increases all allies' DEF by 15% (effect disappears upon own death).",
        sourceScreenshot: "Screenshot 2026-09-13 at 8.42.24\u202fAM.png",
      },
      {
        stage: "III",
        name: "Assault",
        description:
          "Reduces the cooldown time of Torrent and Ship Raid by 25%.",
        sourceScreenshot: "Screenshot 2026-09-13 at 8.42.25\u202fAM.png",
      },
    ],
    artifact: {
      name: "Siren Blade",
      iconUrl: "/artifacts/sea-captain.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Water Blade",
          description:
            "When dealing damage, the farther the enemy from the caster, the higher the damage, capped at 4 times.",
        },
        {
          tier: "gold",
          skill: "Torrent",
          description:
            "On hit, reduces the enemy's DEF by 20% and MOV SPD by 25% for 5s.",
        },
        {
          tier: "red",
          skill: "Ghost Ship",
          description:
            "Converts 75% of the damage dealt to enemies into self HP.",
        },
        {
          tier: "rainbow",
          name: "Ship Raid",
          description:
            "Every 9s, summons a small fleet of ghost ships to ram into a random enemy, dealing 900% Physical DMG and knocking back the enemy significantly.",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Ghost Ship",
        unlockStars: 0,
        iconUrl: talent("sea-captain", "ghost-ship"),
        description:
          "Summons a ghost ship to ram enemies, dealing 720% Physical DMG to enemies in a large area and stunning them for 2s.",
      },
      {
        kind: "battle",
        name: "Water Blade",
        unlockStars: 2,
        iconUrl: talent("sea-captain", "water-blade"),
        description:
          "Basic ATK has a 50% chance to deal damage to enemies within 300 yards in front.",
      },
      {
        kind: "enhance",
        name: "Rogue Waves",
        unlockStars: 5,
        iconUrl: talent("sea-captain", "rogue-waves"),
        description:
          "Ghost Ship: when the Ghost Ship is released, increases all allies' MOV SPD by 30% for 3s.",
      },
      {
        kind: "special",
        name: "Torrent",
        unlockStars: 8,
        iconUrl: talent("sea-captain", "torrent"),
        description:
          "Summons a water flow every 8s to stun an enemy for 2.5s and deal 450% Physical DMG.",
      },
      {
        kind: "passive",
        name: "Steadfast Body",
        unlockStars: 12,
        iconUrl: talent("sea-captain", "steadfast-body"),
        description: "HP increased by 15%, ATK increased by 10%.",
      },
      {
        kind: "enhance",
        name: "Undying",
        unlockStars: 16,
        iconUrl: talent("sea-captain", "undying"),
        description:
          "Ghost Ship: when hitting enemies, it steals their souls, reducing their DMG Result by 15% and their HP Regen per second by 2% for 6s.",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Ghost Ship",
        description: "Ghost Ship enhances Physical DMG by 360% of Attack.",
      },
      {
        name: "Brawler's Armor",
        skill: "Torrent",
        description:
          "Torrent additionally drains the target's Energy by 120 points.",
      },
      {
        name: "Cavalier Helm",
        skill: "Water Blade",
        description:
          "Water Blade additionally inflicts True DMG equal to 18% (54%) of Attack.",
      },
      {
        name: "Brawler's Boots",
        skill: "Undying",
        description:
          "Undying further reduces the enemy's final DMG dealt by 15%.",
      },
    ],
    divinities: ["warrior-atk", "atk"],
  },
  nezha: {
    awakeningSkills: [
      {
        stage: "I",
        name: "Samadhi Flame",
        description:
          "Attacks deal bonus damage equal to 3% of the enemy's Max HP (capped at 150% of Nezha's Attack).",
        sourceScreenshot: "Screenshot 2026-09-13 at 8.42.32\u202fAM.png",
      },
      {
        stage: "III",
        name: "Lotus Ward",
        description:
          "For every 10% max HP lost, increases own energy recovery upon taking damage by 10%.",
        sourceScreenshot: "Screenshot 2026-09-13 at 8.42.37\u202fAM.png",
      },
    ],
    artifact: {
      name: "Fire-Tipped Spear",
      iconUrl: "/artifacts/nezha.png",
      bonuses: [
        {
          tier: "purple",
          skill: "Fire-Tipped Spear",
          description: '"Fire-Tipped Spear" trigger chance increased by 10%',
        },
        {
          tier: "gold",
          skill: "Armillary Sash",
          description:
            '"Armillary Sash" increases own defense by 15% for 4 s after each cast',
        },
        {
          tier: "red",
          skill: "Wind Fire Wheels",
          description: '"Wind Fire Wheels" releases 2 wheels per cast',
        },
        {
          tier: "rainbow",
          name: "Immortal Divine Body",
          description:
            "Upon taking fatal damage, instantly restore 55% of max HP and gain 30% DEF and 100% Energy Regen SPD per second for 8s. (Triggers once per battle)",
        },
      ],
    },
    skills: [
      {
        kind: "ultimate",
        name: "Wind Fire Wheels",
        unlockStars: 0,
        iconUrl: talent("nezha", "wind-fire-wheels"),
        description:
          "Throw a Wind Fire Wheel towards the front of the battlefield, dealing 450% physical damage to all enemies in its path.",
      },
      {
        kind: "battle",
        name: "Fire-Tipped Spear",
        unlockStars: 2,
        iconUrl: talent("nezha", "fire-tipped-spear"),
        description:
          "30% chance to deal True DMG to enemies in front on Basic ATK.",
      },
      {
        kind: "enhance",
        name: "Windfire",
        unlockStars: 5,
        iconUrl: talent("nezha", "windfire"),
        description:
          "Wind Fire Wheels increases MOV SPD by 8% per cast, lasting until battle ends (max stacks: 3).",
      },
      {
        kind: "special",
        name: "Armillary Sash",
        unlockStars: 8,
        iconUrl: talent("nezha", "armillary-sash"),
        description:
          "When taking damage exceeding 10% of max HP in a single hit, releases Armillary Sash on the attacker, reducing their Energy Regen SPD by 40% per second and ATK by 25% for 5s (CD: 8 s).",
      },
      {
        kind: "passive",
        name: "Threefold Arms",
        unlockStars: 12,
        iconUrl: talent("nezha", "threefold-arms"),
        description: "Attack increased by 15%, HP increased by 10%.",
      },
      {
        kind: "enhance",
        name: "Scorching Ember",
        unlockStars: 16,
        iconUrl: talent("nezha", "scorching-ember"),
        description:
          "Wind Fire Wheels applies Scorching Ember to enemies hit, lasting 9 seconds. Enemies with Scorching Ember have their crit rate reduced by 12% and HP regeneration per second reduced by 1% (max stacks: 3).",
      },
    ],
    cores: [
      {
        name: "Blade of Valor",
        skill: "Wind Fire Wheels",
        description:
          "Wind Fire Wheels increases Physical DMG from attacks by 35%(105%).",
      },
      {
        name: "Brawler's Armor",
        skill: "Windfire",
        description:
          "Windfire additionally boosts own Magic Resistance by 2.5%(7.5%) each time.",
      },
      {
        name: "Cavalier Helm",
        skill: "Fire-Tipped Spear",
        description:
          "Fire-Tipped Spear raises the chance to inflict True DMG by 6%(18%).",
      },
      {
        name: "Brawler's Boots",
        skill: "Armillary Sash",
        description:
          "Armillary Sash further slows Energy Regeneration speed by 10%(30%).",
      },
    ],
    divinities: ["atk", "melee-dmg-boost"],
  },
};
