import {
  LoadingPage,
  Skeleton,
  TextSkeleton,
} from "@/components/loading-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <LoadingPage
      label="invitation form"
      className="max-w-md flex-1 justify-center gap-5 px-4 py-16"
    >
      <Card>
        <CardHeader className="gap-3">
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="h-8 w-64 max-w-full" />
          <TextSkeleton lines={3} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>
          <Skeleton className="h-8 w-full" />
          <TextSkeleton lines={2} />
        </CardContent>
      </Card>
      <TextSkeleton lines={2} />
    </LoadingPage>
  );
}
