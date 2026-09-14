"use client";

import { useI18n } from "@/lib/i18n/client";
import {
  LoadingPage,
  Skeleton,
  TextSkeleton,
} from "@/components/loading-skeleton";
import { Card, CardHeader } from "@/components/ui/card";

export default function Loading() {
  const { t } = useI18n();

  return (
    <LoadingPage
      label={t("home")}
      className="max-w-6xl flex-1 gap-10 px-4 py-12 sm:px-6"
    >
      <section className="flex flex-col gap-4">
        <Skeleton className="h-5.5 w-48" />
        <Skeleton className="h-[2.4rem] w-full max-w-2xl" />
        <div className="max-w-2xl">
          <TextSkeleton lines={2} />
        </div>
        <Skeleton className="h-9 w-40" />
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i}>
            <CardHeader className="gap-2">
              <Skeleton className="mb-2 size-5" />
              <Skeleton className="h-5.5 w-32" />
              <TextSkeleton lines={2} />
            </CardHeader>
          </Card>
        ))}
      </section>
    </LoadingPage>
  );
}
