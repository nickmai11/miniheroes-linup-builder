"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import type { LineupSort } from "@/lib/lineup-order";

export function LineupSortSelect({ value }: { value: LineupSort }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useOptimistic(value);

  return (
    <label className="flex items-center gap-2 text-sm">
      {pending && (
        <span role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">{t("Sorting lineups…")}</span>
        </span>
      )}
      <span className="text-muted-foreground">{t("Sort by")}</span>
      <select
        value={selected}
        disabled={pending}
        className="border-input bg-background focus-visible:ring-ring rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
        onChange={(event) => {
          const next = event.target.value === "likes" ? "likes" : "date";
          const params = new URLSearchParams(searchParams.toString());
          if (next === "date") params.delete("sort");
          else params.set("sort", next);
          const query = params.toString();
          startTransition(() => {
            setSelected(next);
            router.replace(`${pathname}${query ? `?${query}` : ""}`, {
              scroll: false,
            });
          });
        }}
      >
        <option value="date">{t("Newest first")}</option>
        <option value="likes">{t("Most liked")}</option>
      </select>
    </label>
  );
}
