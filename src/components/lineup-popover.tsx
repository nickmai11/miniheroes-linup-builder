"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import type { Lineup } from "@/db/schema";
import type { LineupWithHeroes } from "@/lib/lineups";
import { useI18n } from "@/lib/i18n/client";
import { InfoPopover } from "@/components/info-popover";
import { HeroName, HeroPortrait } from "@/components/hero-portrait";
import { BuildPopover } from "@/components/build-popover";
import { LineupAssignments } from "@/components/lineup-assignments";
import { LineupFishes } from "@/components/lineup-fishes";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/loading-skeleton";

type Preview = Pick<
  LineupWithHeroes,
  "id" | "name" | "description" | "slots" | "fishes"
> & { contextPage: string };

export function LineupPopover({
  lineup,
  heroSlug,
}: {
  lineup: Pick<Lineup, "id" | "name" | "createdAt">;
  heroSlug: string;
}) {
  const { t, formatDate } = useI18n();
  return (
    <div className="flex min-w-0 items-center gap-2">
      <InfoPopover
        label={t("Preview {name} lineup", { name: lineup.name })}
        nativeButton={false}
        triggerRole="link"
        side="bottom"
        popupClassName="w-[min(48rem,calc(100vw-2rem))]"
        trigger={
          <Link
            href={`/lineups/${lineup.id}`}
            className="hover:text-primary focus-visible:outline-ring flex min-w-0 flex-1 items-baseline justify-between gap-4 rounded py-2 focus-visible:outline-2"
          >
            <span className="min-w-0 font-medium wrap-break-word">
              {lineup.name}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {formatDate(lineup.createdAt)}
            </span>
          </Link>
        }
        secondaryTrigger={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("Preview {name} lineup", { name: lineup.name })}
          >
            <Eye aria-hidden="true" />
          </Button>
        }
      >
        <LineupPreview lineupId={lineup.id} heroSlug={heroSlug} />
      </InfoPopover>
    </div>
  );
}

/** Mounted by the popover only while open; closed previews do not fetch data. */
function LineupPreview({
  lineupId,
  heroSlug,
}: {
  lineupId: number;
  heroSlug: string;
}) {
  const { t } = useI18n();
  const [lineup, setLineup] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ id: String(lineupId), hero: heroSlug });
    void (async () => {
      try {
        const response = await fetch(`/api/lineups/preview?${query}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            response.status === 401 || response.status === 403
              ? "Open the lineup with an invitation to view it."
              : response.status === 404
                ? "This lineup is no longer available."
                : "Could not load the lineup preview. Please try again.",
          );
        }
        const data: Preview = await response.json();
        if (!controller.signal.aborted) setLineup(data);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Could not load the lineup preview. Please try again.",
          );
      }
    })();
    return () => controller.abort();
  }, [lineupId, heroSlug, attempt]);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {lineup ? (
        <LineupPreviewContent lineup={lineup} />
      ) : error ? (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-muted-foreground text-sm">
            {t(error)}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              setAttempt((value) => value + 1);
            }}
          >
            {t("Retry")}
          </Button>
        </div>
      ) : (
        <div
          role="status"
          aria-label={t("Loading lineup preview")}
          className="flex flex-col gap-3"
        >
          <Skeleton className="h-5 w-1/2" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="aspect-[81/100] w-full" />
            ))}
          </div>
          <span className="sr-only">{t("Loading lineup preview")}</span>
        </div>
      )}
    </div>
  );
}

export function LineupPreviewContent({ lineup }: { lineup: Preview }) {
  const { gameLabel, t } = useI18n();
  return (
    <>
      <h3 className="font-semibold wrap-break-word">{lineup.name}</h3>
      <ul
        aria-label={t("Lineup heroes")}
        className="grid grid-cols-2 items-start gap-3 sm:grid-cols-5"
      >
        {lineup.slots.map((hero, index) => (
          <li key={index} className="flex min-w-0 flex-col gap-2">
            {hero ? (
              <>
                <Link
                  href={`/heroes/${hero.slug}`}
                  aria-label={t("View {name}", {
                    name: gameLabel("hero", hero),
                  })}
                  className="hover:text-primary focus-visible:outline-ring flex min-w-0 flex-col gap-1 rounded focus-visible:outline-2"
                >
                  <HeroPortrait
                    hero={hero}
                    sizes="(max-width: 640px) 40vw, 130px"
                  />
                  <HeroName hero={hero} className="text-xs font-medium" />
                </Link>
                <span className="text-muted-foreground text-xs">
                  {t("Slot {number}", { number: index + 1 })}
                </span>
                {hero.build && (
                  <BuildPopover
                    build={hero.build}
                    contextPage={lineup.contextPage}
                  />
                )}
                <LineupAssignments pets={hero.pets} relics={hero.relics} />
              </>
            ) : (
              <div className="text-muted-foreground flex aspect-[81/100] items-center justify-center rounded-md border border-dashed text-xs">
                {t("Slot {number}", { number: index + 1 })}
              </div>
            )}
          </li>
        ))}
      </ul>
      <LineupFishes fishes={lineup.fishes} />
      {lineup.description && (
        <p className="text-muted-foreground text-sm wrap-break-word whitespace-pre-wrap">
          {lineup.description}
        </p>
      )}
    </>
  );
}
