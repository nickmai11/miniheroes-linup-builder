import {
  HeroFiltersSkeleton,
  HeroGridSkeleton,
  LoadingPage,
  PageHeadingSkeleton,
} from "@/components/loading-skeleton";

export default function Loading() {
  return (
    <LoadingPage label="hero pool">
      <PageHeadingSkeleton title="Hero pool" />
      <div className="flex flex-col gap-6">
        <HeroFiltersSkeleton />
        <HeroGridSkeleton />
      </div>
    </LoadingPage>
  );
}
