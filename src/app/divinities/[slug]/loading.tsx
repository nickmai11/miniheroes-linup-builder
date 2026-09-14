"use client";

import { useI18n } from "@/lib/i18n/client";
import {
  HeroGridSkeleton,
  LoadingPage,
  Skeleton,
} from "@/components/loading-skeleton";

export default function Loading() {
  const { t } = useI18n();

  return (
    <LoadingPage
      label={t("divinity details")}
      className="max-w-5xl gap-6 px-4 py-8 sm:px-6"
    >
      <Skeleton className="h-5.5 w-24" />
      <header className="flex items-center gap-4">
        <Skeleton className="size-18 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-col gap-1">
          <Skeleton className="h-[2.4rem] w-56 max-w-full" />
          <Skeleton className="h-[1.55rem] w-28" />
        </div>
      </header>
      <section className="flex flex-col gap-3">
        <h2 className="text-primary text-xs font-medium tracking-wide uppercase">
          {t("Heroes")}
        </h2>
        <HeroGridSkeleton count={6} />
      </section>
    </LoadingPage>
  );
}
