import type { ReactNode } from "react";
import { cn } from "cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-muted rounded-md motion-safe:animate-pulse", className)}
    />
  );
}

/** Keep placeholders out of the accessibility tree and announce loading once. */
export function LoadingPage({
  label,
  children,
  className = "max-w-6xl gap-6 px-4 py-8 sm:px-6",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      aria-busy="true"
      aria-label={`Loading ${label}`}
      className={cn("mx-auto flex w-full flex-col", className)}
    >
      <p role="status" className="sr-only">
        Loading {label}…
      </p>
      <div aria-hidden="true" className="contents">
        {children}
      </div>
    </main>
  );
}

export function PageHeadingSkeleton({
  title,
  description = false,
  actions = false,
}: {
  title?: string;
  description?: boolean;
  actions?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        {title ? (
          <h1 className="text-2xl font-semibold">{title}</h1>
        ) : (
          <Skeleton className="h-8 w-56 max-w-full" />
        )}
        {description && <Skeleton className="h-5.5 w-96 max-w-full" />}
      </div>
      {actions && <Skeleton className="h-8 w-28" />}
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex w-full flex-col gap-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-4/5" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SectionSkeleton({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function HeroFiltersSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Skeleton className="h-8 w-56 max-w-full" />
      <div className="flex max-w-full gap-px overflow-hidden rounded-md">
        {["w-10", "w-22", "w-25", "w-18", "w-23"].map((width) => (
          <Skeleton
            key={width}
            className={cn("h-7 shrink-0 rounded-none", width)}
          />
        ))}
      </div>
    </div>
  );
}

export function HeroGridSkeleton({
  count = 12,
  className = "grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
  compact = false,
}: {
  count?: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <ul className={cn("grid", className)}>
      {Array.from({ length: count }, (_, i) => (
        <li
          key={i}
          className="bg-card flex min-w-0 flex-col gap-1.5 rounded-lg border p-1.5 shadow-xs"
        >
          <Skeleton className="aspect-[81/100] w-full" />
          <div
            className={cn(
              "flex items-center justify-center",
              compact ? "min-h-9" : "min-h-10",
            )}
          >
            <Skeleton className="h-4 w-4/5" />
          </div>
        </li>
      ))}
    </ul>
  );
}
