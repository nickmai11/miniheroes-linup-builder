import "server-only";
import vietnamese from "./game-text-vi.json";
import { getI18n } from "./server";

// Keyed by the exact English description in src/data/hero-details.ts; an
// edited description falls back to English until its translation is updated.
// Server-only so the translations never ship in the client bundle.
const vi: Readonly<Record<string, string>> = vietnamese;

/** Translates hero talent, artifact, core and awakening descriptions. */
export async function getDescriptionLocalizer() {
  const { locale } = await getI18n();
  return <T extends { description: string | null }>(item: T): T =>
    locale === "vi" && item.description && Object.hasOwn(vi, item.description)
      ? { ...item, description: vi[item.description] }
      : item;
}
