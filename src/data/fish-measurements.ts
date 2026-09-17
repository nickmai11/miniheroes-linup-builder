import { fishHighestRecordSeeds } from "./fish-highest-records";
import type { FishStatSample } from "@/lib/fish-measurements";

/** Owner's aquarium samples; sources and label mappings are in the game reference. */
export const fishMeasurementSeeds: Record<
  string,
  { bestSizeCm: number | null; statSample: FishStatSample }
> = {
  "fin-squid": {
    bestSizeCm: fishHighestRecordSeeds["fin-squid"].bestSizeCm,
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
    bestSizeCm: fishHighestRecordSeeds["rainbow-snail"].bestSizeCm,
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
    bestSizeCm: fishHighestRecordSeeds["zebrafish"].bestSizeCm,
    statSample: {
      sizeCm: 18,
      stats: { "Mage ATK": 5211, DEF: 693, "Anti-Crit Rate": 4.37 },
    },
  },
  "rose-fish": {
    bestSizeCm: fishHighestRecordSeeds["rose-fish"].bestSizeCm,
    statSample: {
      sizeCm: 26.1,
      stats: { "Mage ATK": 5940, DEF: 792, "Receive Healing": 9.9 },
    },
  },
  "kissing-fish": {
    bestSizeCm: fishHighestRecordSeeds["kissing-fish"].bestSizeCm,
    statSample: {
      sizeCm: 26.1,
      stats: { "Mage HP": 78412, DEF: 738, "DMG Reduction": 3.24 },
    },
  },
  // gameplay/fishes/image copy 4.png
  lophiomus: {
    bestSizeCm: fishHighestRecordSeeds["lophiomus"].bestSizeCm,
    statSample: {
      sizeCm: 53.1,
      stats: { "Marksman ATK": 4545, HP: 37440, "MOV SPD": 6.57 },
    },
  },
  oarfish: {
    bestSizeCm: fishHighestRecordSeeds["oarfish"].bestSizeCm,
    statSample: {
      sizeCm: 384.3,
      stats: { ATK: 2083, "Support HP": 73822, "Knockback Effect": 6.08 },
    },
  },
  // gameplay/fishes/image copy 5.png
  "ancient-black-fish": {
    bestSizeCm: fishHighestRecordSeeds["ancient-black-fish"].bestSizeCm,
    statSample: {
      sizeCm: 1107,
      stats: { ATK: 2245, "Support HP": 79560, "Physical DMG Boost": 4.68 },
    },
  },
  "hermit-crab": {
    bestSizeCm: fishHighestRecordSeeds["hermit-crab"].bestSizeCm,
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
