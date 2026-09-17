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
        <div className="flex gap-1 border-b" aria-hidden="true">
          {["Released", "Unreleased"].map((label) => (
            <span
              key={label}
              className="text-muted-foreground px-4 py-2 text-sm font-medium"
            >
              {t(label)}
            </span>
          ))}
        </div>
        <HeroFiltersSkeleton />
        <HeroGridSkeleton />
      </div>
    </LoadingPage>
  );
}
