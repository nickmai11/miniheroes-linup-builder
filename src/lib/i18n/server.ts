import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocale } from "./config";
import { createI18n } from "./messages";

export const getI18n = cache(async () => {
  const [cookieStore, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);
  return createI18n(
    resolveLocale(
      cookieStore.get(LOCALE_COOKIE)?.value,
      requestHeaders.get("accept-language"),
    ),
  );
});
