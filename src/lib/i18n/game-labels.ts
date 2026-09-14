import english from "./game-en.json";
import vietnamese from "./game-vi.json";
import type { Locale } from "./config";

export type GameLabelKind =
  | "hero"
  | "fish"
  | "fishArea"
  | "fishCollection"
  | "bait"
  | "stat"
  | "divinity"
  | "pet"
  | "relic"
  | "rune"
  | "weapon"
  | "skill"
  | "core"
  | "artifact";
export type GameLabel = string | { name: string; slug?: string };
const en: Readonly<Record<string, string>> = english;
const vi: Readonly<Record<string, string>> = vietnamese;

// Slugs already persisted in the catalog are the translation identifiers.
// Source-name lookup also supports existing projections that only select name.
const sourceKeys = new Map(
  Object.entries(en).map(([key, name]) => [
    `${key.split(".")[0]}:${name.toLowerCase()}`,
    key,
  ]),
);

export function gameLabelKey(
  kind: GameLabelKind,
  value: GameLabel,
): string | undefined {
  if (
    typeof value === "string" &&
    value.startsWith(`${kind}.`) &&
    Object.hasOwn(en, value)
  )
    return value;
  if (typeof value !== "string" && value.slug) {
    const key = `${kind}.${value.slug}`;
    if (Object.hasOwn(en, key)) return key;
  }
  const name = typeof value === "string" ? value : value.name;
  return sourceKeys.get(`${kind}:${name.toLowerCase()}`);
}

export function translateGameLabel(
  locale: Locale,
  kind: GameLabelKind,
  value: GameLabel,
): string {
  const source = typeof value === "string" ? value : value.name;
  const key = gameLabelKey(kind, value);
  if (!key) return source;
  if (locale === "vi") return vi[key] ?? en[key] ?? source;
  return source === key ? en[key] : source;
}

/** Vietnamese searches also work without accents, including đ/d. */
export function normalizeGameSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .trim();
}

export function matchesGameLabel(
  kind: GameLabelKind,
  value: GameLabel,
  query: string,
): boolean {
  const normalized = normalizeGameSearch(query);
  return ["en", "vi"].some((locale) =>
    normalizeGameSearch(
      translateGameLabel(locale as Locale, kind, value),
    ).includes(normalized),
  );
}

/** SQL searches can match translated hero names without rewriting stored names. */
export function matchingGameSlugs(
  kind: GameLabelKind,
  query: string,
): string[] {
  if (!normalizeGameSearch(query)) return [];
  return Object.keys(en)
    .filter(
      (key) => key.startsWith(`${kind}.`) && matchesGameLabel(kind, key, query),
    )
    .map((key) => key.slice(kind.length + 1));
}
