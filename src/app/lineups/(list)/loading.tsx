"use client";

import { useI18n } from "@/lib/i18n/client";
import {
  LoadingPage,
  PageHeadingSkeleton,
  Skeleton,
  TextSkeleton,
} from "@/components/loading-skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export default function Loading() {
  const { t } = useI18n();

  return (
    <LoadingPage
      label={t("lineups")}
      className="max-w-4xl gap-6 px-4 py-8 sm:px-6"
    >
      <PageHeadingSkeleton title={t("Lineups")} actions />
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i}>
            <Card>
              <CardHeader>
                <div className="flex items-baseline justify-between gap-4">
                  <Skeleton className="h-5.5 w-40" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="grid max-w-sm grid-cols-5 gap-2">
                  {Array.from({ length: 5 }, (_, slot) => (
                    <div key={slot} className="flex min-w-0 flex-col gap-1.5">
                      <Skeleton className="aspect-[81/100] w-full" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex gap-1">
                        <Skeleton className="size-6" />
                        <Skeleton className="size-6" />
                      </div>
                    </div>
                  ))}
                </div>
                <TextSkeleton lines={2} />
              </CardContent>
              <CardFooter className="flex-wrap justify-end gap-2 py-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </LoadingPage>
  );
}
