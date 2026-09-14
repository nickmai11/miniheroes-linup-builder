"use client";

import { useI18n } from "@/lib/i18n/client";
import {
  LineupFishesSkeleton,
  LineupSlotsSkeleton,
} from "@/components/lineup-skeleton";
import {
  LoadingPage,
  PageHeadingSkeleton,
  SectionSkeleton,
  Skeleton,
  TextSkeleton,
} from "@/components/loading-skeleton";

export default function Loading() {
  const { t } = useI18n();

  return (
    <LoadingPage
      label={t("lineup details")}
      className="max-w-4xl gap-6 px-4 py-8 sm:px-6"
    >
      <PageHeadingSkeleton description />
      <div className="flex flex-wrap items-start gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-28" />
        ))}
      </div>
      <LineupSlotsSkeleton />
      <LineupFishesSkeleton />
      <SectionSkeleton title={t("Why it works")}>
        <TextSkeleton lines={4} />
      </SectionSkeleton>
      <SectionSkeleton title={t("Hero notes")}>
        <TextSkeleton />
      </SectionSkeleton>
    </LoadingPage>
  );
}
