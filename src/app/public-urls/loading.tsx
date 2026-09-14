import {
  LoadingPage,
  PageHeadingSkeleton,
  SectionSkeleton,
  Skeleton,
  TextSkeleton,
} from "@/components/loading-skeleton";

export default function Loading() {
  return (
    <LoadingPage
      label="public URLs"
      className="max-w-3xl gap-6 px-4 py-8 sm:px-6"
    >
      <PageHeadingSkeleton title="Public URLs" description />
      <div className="flex flex-col gap-6">
        <SectionSkeleton title="Make a page public">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-20" />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-28" />
            </div>
            <TextSkeleton lines={2} />
          </div>
        </SectionSkeleton>
        <SectionSkeleton title="Public pages">
          <ul className="divide-y">
            {Array.from({ length: 3 }, (_, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-1 basis-48 flex-col gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </li>
            ))}
          </ul>
        </SectionSkeleton>
      </div>
    </LoadingPage>
  );
}
