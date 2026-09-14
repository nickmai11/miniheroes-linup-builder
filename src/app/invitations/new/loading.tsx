import {
  LoadingPage,
  PageHeadingSkeleton,
  Skeleton,
  TextSkeleton,
} from "@/components/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Loading() {
  return (
    <LoadingPage
      label="invitation codes"
      className="max-w-2xl gap-6 px-4 py-8 sm:px-6"
    >
      <PageHeadingSkeleton title="Invitation codes" description />
      <Card>
        <CardHeader>
          <CardTitle>Invite someone</CardTitle>
          <TextSkeleton lines={2} />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Skeleton className="h-8 w-40" />
        </CardContent>
      </Card>
    </LoadingPage>
  );
}
