"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { isLocale, LOCALE_COOKIE, LOCALE_MAX_AGE } from "@/lib/i18n/config";

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex min-h-9 items-center gap-1 rounded-md border px-1.5 text-xs sm:px-2">
      <Languages className="hidden size-4 shrink-0 sm:block" aria-hidden />
      <span className="sr-only">{t("Language")}</span>
      <select
        value={locale}
        disabled={pending}
        aria-busy={pending}
        onChange={(event) => {
          const next = event.target.value;
          if (!isLocale(next) || next === locale) return;
          document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=${LOCALE_MAX_AGE}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
          startTransition(() => router.refresh());
        }}
        className="bg-background focus-visible:outline-ring min-h-8 max-w-24 cursor-pointer rounded-sm outline-offset-2 disabled:cursor-wait"
      >
        <option value="en" lang="en">
          English
        </option>
        <option value="vi" lang="vi">
          Tiếng Việt
        </option>
      </select>
      <span role="status" className="sr-only">
        {pending ? t("Changing language…") : ""}
      </span>
    </label>
  );
}
