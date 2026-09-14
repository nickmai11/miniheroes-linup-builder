import vietnamese from "./vi.json";
import type { Locale } from "./config";

export type MessageValues = Record<string, string | number>;
const translations: Readonly<Record<string, string>> = vietnamese;

/** English source messages are also the fallback for unrecorded translations. */
export function createI18n(locale: Locale) {
  const intlLocale = locale === "vi" ? "vi-VN" : "en-US";
  function t(message: string, values: MessageValues = {}): string {
    const translated =
      locale === "vi" && Object.hasOwn(translations, message)
        ? translations[message]
        : message;
    return translated.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
      Object.hasOwn(values, key) ? String(values[key]) : placeholder,
    );
  }
  function formatDate(value: Date | string | number, withTime = false) {
    return new Intl.DateTimeFormat(intlLocale, {
      dateStyle: "medium",
      ...(withTime ? { timeStyle: "short" as const } : {}),
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(value));
  }
  function formatNumber(value: number) {
    return new Intl.NumberFormat(intlLocale).format(value);
  }
  return { locale, t, formatDate, formatNumber };
}
