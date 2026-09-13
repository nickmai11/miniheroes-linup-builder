import { requireAppAccess } from "@/lib/app-access";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { HeroName, HeroPortrait } from "@/components/hero-portrait";
import { LineupFishes } from "@/components/lineup-fishes";
import { LineupAssignments } from "@/components/lineup-assignments";
import { BuildPopover } from "@/components/build-popover";
import { LineupShare } from "@/components/lineup-share";
import { PageShell } from "@/components/page-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLineup } from "@/lib/lineups";
import { canEditLocally } from "@/lib/local-editing";
import { deleteLineup } from "../actions";

export const dynamic = "force-dynamic";

const SLOT_LABELS = ["Slot 1", "Slot 2", "Slot 3", "Slot 4", "Slot 5"];

export async function generateMetadata(
  props: PageProps<"/lineups/[id]">,
): Promise<Metadata> {
  await requireAppAccess();
  const { id } = await props.params;
  const lineup = Number.isInteger(Number(id))
    ? await getLineup(Number(id))
    : undefined;
  return { title: lineup?.name ?? "Lineup" };
}

export default async function LineupPage(props: PageProps<"/lineups/[id]">) {
  await requireAppAccess();
  const { id } = await props.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const [lineup, canEdit] = await Promise.all([
    getLineup(numericId),
    canEditLocally(),
  ]);
  if (!lineup) notFound();

  return (
    <PageShell
      title={lineup.name}
      description={`Saved ${lineup.createdAt.toLocaleString()}`}
      width="max-w-4xl"
      actions={
        <div className="flex flex-wrap items-start gap-2">
          <LineupShare lineupId={lineup.id} canInvite={canEdit} />
          {canEdit && (
            <>
              <Link
                href={`/lineups/${lineup.id}/edit`}
                className={buttonVariants()}
              >
                <Pencil data-icon="inline-start" /> Edit lineup
              </Link>
              <Link
                href={`/lineups/new?clone=${lineup.id}`}
                className={buttonVariants({ variant: "outline" })}
              >
                <Copy data-icon="inline-start" /> Clone lineup
              </Link>
              <Link
                href="/lineups/new"
                className={buttonVariants({ variant: "outline" })}
              >
                <Plus data-icon="inline-start" /> New lineup
              </Link>
              <form action={deleteLineup.bind(null, lineup.id)}>
                <Button type="submit" variant="destructive">
                  <Trash2 data-icon="inline-start" /> Delete
                </Button>
              </form>
            </>
          )}
        </div>
      }
    >
      <ul className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 md:grid-cols-5">
        {lineup.slots.map((hero, i) => (
          <li
            key={i}
            className="bg-card flex min-w-0 flex-col items-center gap-1.5 rounded-lg border p-2 text-center"
          >
            {hero ? (
              <Link
                href={`/heroes/${hero.slug}`}
                aria-label={`View ${hero.name}`}
                className="hover:text-primary focus-visible:outline-ring flex w-full min-w-0 flex-col items-center gap-1.5 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <HeroPortrait
                  hero={hero}
                  sizes="(max-width: 640px) 45vw, 160px"
                />
                <HeroName hero={hero} className="text-base font-medium" />
              </Link>
            ) : (
              <div className="aspect-[81/100] w-full rounded-md border border-dashed" />
            )}
            <span className="text-muted-foreground text-xs">
              {SLOT_LABELS[i]}
            </span>
            {hero?.build && (
              <div className="mt-1 w-full border-t pt-2 text-left">
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  Build
                </p>
                <BuildPopover build={hero.build} />
              </div>
            )}
            {hero && (hero.pets.length > 0 || hero.relics.length > 0) && (
              <div className="mt-1 w-full border-t pt-2">
                <LineupAssignments pets={hero.pets} relics={hero.relics} />
              </div>
            )}
          </li>
        ))}
      </ul>

      <LineupFishes fishes={lineup.fishes} />

      {lineup.description ? (
        <Card>
          <CardHeader>
            <CardTitle>Why it works</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{lineup.description}</p>
          </CardContent>
        </Card>
      ) : null}

      {lineup.slots.some((h) => h?.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Hero notes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {lineup.slots.map(
              (hero, i) =>
                hero?.notes && (
                  <p key={i} className="text-sm">
                    <Link
                      href={`/heroes/${hero.slug}`}
                      className="hover:text-primary hover:underline"
                    >
                      <HeroName hero={hero} className="font-medium" />
                    </Link>
                    {": "}
                    <span className="text-muted-foreground">{hero.notes}</span>
                  </p>
                ),
            )}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
