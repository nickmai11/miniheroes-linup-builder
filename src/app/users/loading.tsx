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
    <LoadingPage
      label={t("Users")}
      className="max-w-6xl gap-6 px-4 py-8 sm:px-6"
    >
      <PageHeadingSkeleton title={t("Users")} description />
      <Skeleton className="h-10 w-full max-w-sm" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
    </LoadingPage>
  );
}
