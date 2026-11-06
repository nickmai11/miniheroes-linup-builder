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
    <LoadingPage label={t("Relics")}>
      <PageHeadingSkeleton title={t("Relics")} description />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </LoadingPage>
  );
}
