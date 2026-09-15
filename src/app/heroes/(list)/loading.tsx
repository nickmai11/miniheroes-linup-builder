"use client";

import { useI18n } from "@/lib/i18n/client";
import {
  HeroFiltersSkeleton,
  HeroGridSkeleton,
  LoadingPage,
  PageHeadingSkeleton,
} from "@/components/loading-skeleton";

export default function Loading() {
  const { t } = useI18n();

  return (
    <LoadingPage label={t("Heroes")}>
      <PageHeadingSkeleton title={t("Heroes")} />
      <div className="flex flex-col gap-6">
        <HeroFiltersSkeleton />
        <HeroGridSkeleton />
      </div>
    </LoadingPage>
  );
}
