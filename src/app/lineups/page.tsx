import { requireAppAccess } from "@/lib/app-access";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { HeroPortrait } from "@/components/hero-portrait";
import { LineupAssignments } from "@/components/lineup-assignments";
import { LineupShare } from "@/components/lineup-share";
import { BuildPopover } from "@/components/build-popover";
import { PageShell } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllLineups } from "@/lib/lineups";
import { canEditLocally } from "@/lib/local-editing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lineups" };

export default async function LineupsPage() {
  await requireAppAccess();
  const [lineups, canEdit] = await Promise.all([
    getAllLineups(),
    canEditLocally(),
  ]);

  return (
    <PageShell
      title="Lineups"
      width="max-w-4xl"
      actions={
        canEdit && (
          <Link href="/lineups/new" className={buttonVariants()}>
            <Plus data-icon="inline-start" /> New lineup
          </Link>
        )
      }
    >
      {lineups.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center">
            No lineups yet.
            {canEdit && (
              <>
                {" "}
                <Link href="/lineups/new" className="text-primary underline">
                  Build the first one.
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {lineups.map((lineup) => (
            <li key={lineup.id}>
              <Card>
                <Link
                  href={`/lineups/${lineup.id}`}
                  className="hover:text-primary flex flex-col gap-4 transition-colors"
                >
                  <CardHeader>
                    <CardTitle className="flex items-baseline justify-between gap-4">
                      <span>{lineup.name}</span>
                      <span className="text-muted-foreground text-xs font-normal">
                        {lineup.createdAt.toLocaleDateString()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                </Link>
                <CardContent className="flex flex-col gap-3">
                  <div className="grid max-w-sm grid-cols-5 gap-2">
                    {lineup.slots.map((hero, i) => (
                      <div key={i} className="flex min-w-0 flex-col gap-1.5">
                        {hero ? (
                          <Link
                            href={`/heroes/${hero.slug}`}
                            aria-label={`View ${hero.name}`}
                            className="focus-visible:outline-ring rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
                          >
                            <HeroPortrait hero={hero} sizes="64px" />
                          </Link>
                        ) : (
                          <div className="aspect-[81/100] rounded-md border border-dashed" />
                        )}
                        {hero?.build && <BuildPopover build={hero.build} />}
                        {hero && (
                          <LineupAssignments
                            pets={hero.pets}
                            relics={hero.relics}
                            compact
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {lineup.description && (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {lineup.description}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="justify-end py-2">
                  <LineupShare lineupId={lineup.id} canInvite={canEdit} />
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
