import { ContentVotes } from "@/components/content-votes";
import { getI18n } from "@/lib/i18n/server";
import {
  accessibleLineupIds,
  hasAppAccess,
  requirePageAccess,
} from "@/lib/app-access";
import type { Metadata } from "next";
import Link from "next/link";
import { Copy, Plus } from "lucide-react";
import { HeroPortrait } from "@/components/hero-portrait";
import { LineupFishes } from "@/components/lineup-fishes";
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
import { canEditContent } from "@/lib/editing";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return { title: t("Lineups") };
}

export default async function LineupsPage() {
  const { gameLabel, t, formatDate } = await getI18n();

  await requirePageAccess("/lineups");
  const lineupIds = await accessibleLineupIds();
  const [lineups, canEdit] = await Promise.all([
    getAllLineups(lineupIds),
    canEditContent().then(async (allowed) => allowed && (await hasAppAccess())),
  ]);

  return (
    <PageShell
      title={t("Lineups")}
      width="max-w-4xl"
      description={
        lineupIds !== null
          ? t(
              "Lineups shared with you. Open another invitation link to add a lineup.",
            )
          : undefined
      }
      actions={
        canEdit && (
          <Link href="/lineups/new" className={buttonVariants()}>
            <Plus data-icon="inline-start" /> {t("New lineup")}
          </Link>
        )
      }
    >
      {lineups.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center">
            {t("No lineups yet.")}{" "}
            {canEdit && (
              <>
                {" "}
                <Link href="/lineups/new" className="text-primary underline">
                  {t("Build the first one.")}
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
                        {formatDate(lineup.createdAt)}
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
                            aria-label={t("View {name}", {
                              name: gameLabel("hero", hero),
                            })}
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
                  <LineupFishes fishes={lineup.fishes} />
                  {lineup.description && (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {lineup.description}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex-wrap justify-end gap-2 py-2">
                  <div className="mr-auto">
                    <ContentVotes
                      kind="lineup"
                      id={lineup.id}
                      name={lineup.name}
                    />
                  </div>
                  {canEdit && (
                    <Link
                      href={`/lineups/new?clone=${lineup.id}`}
                      aria-label={t("Clone {name}", { name: lineup.name })}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      <Copy data-icon="inline-start" /> {t("Clone")}
                    </Link>
                  )}
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
