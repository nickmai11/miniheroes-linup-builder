"use client";

import { useI18n } from "@/lib/i18n/client";
import {
  LoadingPage,
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
      label={t("invitation form")}
      className="max-w-md flex-1 justify-center px-4 py-10 sm:py-16"
    >
      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader className="gap-3">
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="h-8 w-64 max-w-full" />
          <TextSkeleton lines={2} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
          <TextSkeleton lines={2} />
        </CardContent>
        <CardFooter className="flex-col items-start gap-1.5">
          <Skeleton className="h-5 w-36" />
          <TextSkeleton lines={2} />
        </CardFooter>
      </Card>
    </LoadingPage>
  );
}
