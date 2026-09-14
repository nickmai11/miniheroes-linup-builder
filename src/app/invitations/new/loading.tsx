"use client";

import { useI18n } from "@/lib/i18n/client";
import {
  LoadingPage,
  PageHeadingSkeleton,
  Skeleton,
  TextSkeleton,
} from "@/components/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Loading() {
  const { t } = useI18n();

  return (
    <LoadingPage
      label={t("invitation codes")}
      className="max-w-2xl gap-6 px-4 py-8 sm:px-6"
    >
      <PageHeadingSkeleton title={t("Invitation codes")} description />
      <Card>
        <CardHeader>
          <CardTitle>{t("Invite someone")}</CardTitle>
          <TextSkeleton lines={2} />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Skeleton className="h-8 w-40" />
        </CardContent>
      </Card>
    </LoadingPage>
  );
}
