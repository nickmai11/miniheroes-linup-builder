import {
  LoadingPage,
  PageHeadingSkeleton,
  Skeleton,
  TextSkeleton,
} from "@/components/loading-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <LoadingPage label="about" className="max-w-3xl gap-6 px-4 py-8 sm:px-6">
      <PageHeadingSkeleton title="About Mini Heroes Lineups" description />
      <TextSkeleton lines={3} />
      <Card>
        <CardHeader>
          <Skeleton className="mb-2 size-6" />
          <Skeleton className="h-7 w-44" />
        </CardHeader>
        <CardContent>
          <TextSkeleton lines={2} />
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
    </LoadingPage>
  );
}
