"use client";

import {
  LoadingPage,
  PageHeadingSkeleton,
  Skeleton,
} from "@/components/loading-skeleton";
import { useI18n } from "@/lib/i18n/client";

export default function Loading() {
  const { t } = useI18n();
  return (
    <LoadingPage label={t("Fishes")}>
      <PageHeadingSkeleton title={t("Fishes")} description />
      <Skeleton className="h-10 w-full sm:w-96" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
    </LoadingPage>
  );
}
