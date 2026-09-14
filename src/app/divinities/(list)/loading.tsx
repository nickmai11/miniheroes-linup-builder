"use client";

import { useI18n } from "@/lib/i18n/client";
import {
  LoadingPage,
  PageHeadingSkeleton,
  Skeleton,
} from "@/components/loading-skeleton";

export default function Loading() {
  const { t } = useI18n();

  return (
    <LoadingPage label={t("divinities")}>
      <PageHeadingSkeleton title={t("Divinities")} description />
      <div className="flex flex-col gap-8">
        {Array.from({ length: 4 }, (_, group) => (
          <section key={group} className="flex flex-col gap-3">
            <Skeleton className="h-5 w-28" />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <li
                  key={i}
                  className="bg-card flex h-12 items-center gap-2 rounded-lg border px-3 py-1 shadow-xs"
                >
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </LoadingPage>
  );
}
