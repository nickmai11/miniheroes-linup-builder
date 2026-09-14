import {
  HeroFiltersSkeleton,
  HeroGridSkeleton,
  LoadingPage,
  PageHeadingSkeleton,
  Skeleton,
  TextSkeleton,
} from "@/components/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LineupFishesSkeleton({ picker = false }: { picker?: boolean }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2
        className={
          picker ? "font-semibold" : "text-muted-foreground text-xs font-medium"
        }
      >
        Fishes
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["Small", "Medium", "Large", "Aquatic"].map((category) => (
          <div key={category} className="flex min-w-0 flex-col gap-1.5">
            <p className="text-muted-foreground text-xs">{category}</p>
            <Skeleton className={picker ? "h-10 w-full" : "h-7 w-4/5"} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function LineupBuilderSkeleton({
  editing = false,
}: {
  editing?: boolean;
}) {
  return (
    <LoadingPage label={editing ? "lineup editor" : "lineup builder"}>
      <PageHeadingSkeleton description />
      <div className="flex min-w-0 flex-col gap-8">
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold">Your lineup</h2>
            <Skeleton className="h-5 w-20" />
          </div>
          <ul className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <li
                key={i}
                className="bg-card flex min-w-0 flex-col gap-2 rounded-lg border p-2 shadow-xs"
              >
                <Skeleton className="h-5 w-12" />
                <Skeleton className="aspect-[81/100] w-full" />
                <div className="flex min-h-9 items-center justify-center">
                  <Skeleton className="h-4 w-4/5" />
                </div>
                {editing && (
                  <div className="flex flex-col gap-2 border-t pt-2">
                    {Array.from({ length: 3 }, (_, j) => (
                      <Skeleton key={j} className="h-8 w-full" />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <Skeleton className="h-5.5 w-full max-w-lg" />
        </section>

        <LineupFishesSkeleton picker />

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
          <section className="flex min-w-0 flex-col gap-4">
            <h2 className="font-semibold">Choose heroes</h2>
            <HeroFiltersSkeleton />
            <Skeleton className="h-5.5 w-44" />
            <HeroGridSkeleton
              count={10}
              compact
              className="grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
            />
          </section>
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle>Lineup details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-36 w-full" />
              </div>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </LoadingPage>
  );
}

export function LineupSlotsSkeleton() {
  return (
    <ul className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 md:grid-cols-5">
      {Array.from({ length: 5 }, (_, i) => (
        <li
          key={i}
          className="bg-card flex min-w-0 flex-col items-center gap-1.5 rounded-lg border p-2 text-center"
        >
          <Skeleton className="aspect-[81/100] w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-5 w-12" />
          <div className="mt-1 flex w-full flex-col gap-2 border-t pt-2">
            <TextSkeleton lines={2} />
            <div className="flex gap-1">
              <Skeleton className="size-7" />
              <Skeleton className="size-7" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
