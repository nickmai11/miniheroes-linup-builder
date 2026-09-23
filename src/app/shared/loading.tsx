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
      label={t("Shared with me")}
      className="max-w-4xl gap-6 px-4 py-8 sm:px-6"
    >
      <PageHeadingSkeleton title={t("Shared with me")} />
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </LoadingPage>
  );
}
