"use client";

import { useI18n } from "@/lib/i18n/client";
import {
  LoadingPage,
  Skeleton,
  TextSkeleton,
} from "@/components/loading-skeleton";

export default function Loading() {
  const { t } = useI18n();

  return (
    <LoadingPage label={t("notes")} className="max-w-2xl gap-8 p-8">
      <h1 className="text-2xl font-semibold">{t("Notes")}</h1>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-24" />
      </div>
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <li
            key={i}
            className="bg-card flex items-start justify-between gap-4 rounded-lg border p-4"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-6 w-1/2" />
              <TextSkeleton lines={2} />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-5.5 w-12" />
          </li>
        ))}
      </ul>
    </LoadingPage>
  );
}
