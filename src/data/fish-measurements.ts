import type { FishStatSample } from "@/lib/fish-measurements";

/** Owner's aquarium samples; sources and label mappings are in the game reference. */
export const fishMeasurementSeeds: Record<
  string,
  { bestSizeCm: number | null; statSample: FishStatSample }
> = {
  "fin-squid": {
    bestSizeCm: 724.31,
    statSample: {
      sizeCm: 643.2,
      stats: {
        "Warrior ATK": 2997,
        "DMG Increase": 2.46,
        "Magic DMG Boost": 3.82,
      },
    },
  },
  "rainbow-snail": {
    bestSizeCm: 8.1,
    statSample: {
      sizeCm: 7.27,
      stats: {
        "Warrior HP": 62185,
        "Crit DMG": 8.08,
        "DMG Reduction": 2.55,
      },
    },
  },
  // gameplay/fishes/image copy 3.png
  zebrafish: {
    bestSizeCm: null,
    statSample: {
      sizeCm: 18,
      stats: { "Mage ATK": 5211, DEF: 693, "Anti-Crit Rate": 4.37 },
    },
  },
  "rose-fish": {
    bestSizeCm: null,
    statSample: {
      sizeCm: 26.1,
      stats: { "Mage ATK": 5940, DEF: 792, "Receive Healing": 9.9 },
    },
  },
  "kissing-fish": {
    bestSizeCm: null,
    statSample: {
      sizeCm: 26.1,
      stats: { "Mage HP": 78412, DEF: 738, "DMG Reduction": 3.24 },
    },
  },
  // gameplay/fishes/image copy 4.png
  lophiomus: {
    bestSizeCm: null,
    statSample: {
      sizeCm: 53.1,
      stats: { "Marksman ATK": 4545, HP: 37440, "MOV SPD": 6.57 },
    },
  },
  oarfish: {
    bestSizeCm: null,
    statSample: {
      sizeCm: 384.3,
      stats: { ATK: 2083, "Support HP": 73822, "Knockback Effect": 6.08 },
    },
  },
  // gameplay/fishes/image copy 5.png
  "ancient-black-fish": {
    bestSizeCm: null,
    statSample: {
      sizeCm: 1107,
      stats: { ATK: 2245, "Support HP": 79560, "Physical DMG Boost": 4.68 },
    },
  },
  "hermit-crab": {
    bestSizeCm: null,
    statSample: {
      sizeCm: 21.6,
      stats: {
        "Warrior HP": 69232,
        "DMG Reduction": 2.84,
        "Physical DMG Boost": 4.41,
      },
    },
  },
};
