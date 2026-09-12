// Client-safe types shared by the builds UI and the server helpers (no DB imports).
import type { HeroBuildRow, RuneAttribute, WeaponAttribute } from "@/db/schema";

export type HeroBuild = HeroBuildRow & {
  /** Chosen rune attributes in catalog order (rune type, then sheet order). */
  runes: RuneAttribute[];
  /** Chosen weapon attributes in catalog order. */
  weapons: WeaponAttribute[];
};
