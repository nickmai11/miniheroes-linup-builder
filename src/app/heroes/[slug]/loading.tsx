"use client";

import { useI18n } from "@/lib/i18n/client";
import {
  LoadingPage,
  SectionSkeleton,
  Skeleton,
  TextSkeleton,
} from "@/components/loading-skeleton";

export default function Loading() {
  const { t } = useI18n();

  return (
    <LoadingPage
      label={t("hero details")}
      className="max-w-5xl gap-6 px-4 py-8 sm:px-6"
    >
      <Skeleton className="h-5.5 w-24" />
      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-4 md:sticky md:top-20 md:self-start">
          <Skeleton className="aspect-[81/100] w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <Skeleton className="h-[2.4rem] w-56 max-w-full" />
            </div>
            <Skeleton className="h-[1.55rem] w-24" />
          </header>

          <SectionSkeleton title={t("Talents")}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, i) => (
                <li
                  key={i}
                  className="bg-background flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-12 shrink-0 rounded-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                  <TextSkeleton lines={4} />
                  {i % 3 !== 2 && (
                    <div className="flex items-start gap-2">
                      <Skeleton className="size-5.5 shrink-0" />
                      <TextSkeleton lines={3} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </SectionSkeleton>

          <SectionSkeleton title={t("Awakening skills")}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }, (_, i) => (
                <li
                  key={i}
                  className="bg-background flex flex-col gap-2 rounded-lg border p-3"
                >
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-3/4" />
                  <TextSkeleton lines={4} />
                </li>
              ))}
            </ul>
          </SectionSkeleton>

          <SectionSkeleton title={t("Artifacts")}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-16 shrink-0" />
                <Skeleton className="h-6 w-40 max-w-full" />
              </div>
              <ul className="flex flex-col gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <li
                    key={i}
                    className="bg-background flex items-start gap-3 rounded-lg border p-3"
                  >
                    <Skeleton className="size-7 shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-2/3" />
                      <TextSkeleton />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </SectionSkeleton>

          <SectionSkeleton title={t("Divinities")}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 2 }, (_, i) => (
                <div
                  key={i}
                  className="flex h-12 items-center gap-2 rounded-lg border px-3 py-1"
                >
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </SectionSkeleton>

          <SectionSkeleton title={t("Builds")}>
            <div className="bg-background flex flex-col gap-8 rounded-lg border p-3">
              <Skeleton className="h-6 w-40" />
              {[t("Runes"), t("Weapons"), t("Cores")].map((section) => (
                <div key={section} className="flex flex-col gap-3">
                  <div className="border-primary bg-primary/10 text-foreground rounded-r-md border-l-4 px-3 py-1.5 text-base font-bold">
                    {section}
                  </div>
                  {section === "Runes" ? (
                    <div className="flex flex-col gap-4">
                      {[
                        t("Attack"),
                        t("Effect"),
                        t("Energy"),
                        t("Survival"),
                      ].map((type) => (
                        <div key={type} className="flex flex-col gap-1.5">
                          <p className="text-xs font-medium">{type}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <Skeleton className="h-7 w-24" />
                            <Skeleton className="h-7 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      <Skeleton className="h-7 w-28" />
                      <Skeleton className="h-7 w-24" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionSkeleton>

          <SectionSkeleton title={t("Lineups")}>
            <div className="flex flex-col divide-y">
              {Array.from({ length: 2 }, (_, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-4 py-2"
                >
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </SectionSkeleton>
        </div>
      </div>
    </LoadingPage>
  );
}
