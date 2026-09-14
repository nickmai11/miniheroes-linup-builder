export const LOCALES = ["en", "vi"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "mini-heroes-locale";
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "vi";
}

/** An explicit choice wins; otherwise honor browser preferences by quality. */
export function resolveLocale(
  cookie?: string,
  acceptLanguage?: string | null,
): Locale {
  if (isLocale(cookie)) return cookie;
  const preferences = (acceptLanguage ?? "").split(",").map((entry, index) => {
    const [tag, ...parameters] = entry.trim().toLowerCase().split(";");
    const quality = parameters.find((parameter) =>
      parameter.trim().startsWith("q="),
    );
    const weight = quality ? Number(quality.trim().slice(2)) : 1;
    return { locale: tag.split("-")[0], weight, index };
  });
  preferences.sort((a, b) => b.weight - a.weight || a.index - b.index);
  return (
    (preferences.find(
      ({ locale, weight }) =>
        isLocale(locale) &&
        Number.isFinite(weight) &&
        weight > 0 &&
        weight <= 1,
    )?.locale as Locale | undefined) ?? DEFAULT_LOCALE
  );
}
