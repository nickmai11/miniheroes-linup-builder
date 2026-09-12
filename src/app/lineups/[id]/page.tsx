import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { HeroName, HeroPortrait } from "@/components/hero-portrait";
import { PageShell } from "@/components/page-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLineup } from "@/lib/lineups";
import { deleteLineup } from "../actions";

export const dynamic = "force-dynamic";

const SLOT_LABELS = ["Slot 1", "Slot 2", "Slot 3", "Slot 4", "Slot 5"];

export async function generateMetadata(
  props: PageProps<"/lineups/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const lineup = Number.isInteger(Number(id))
    ? await getLineup(Number(id))
    : undefined;
  return { title: lineup?.name ?? "Lineup" };
}

export default async function LineupPage(props: PageProps<"/lineups/[id]">) {
  const { id } = await props.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const lineup = await getLineup(numericId);
  if (!lineup) notFound();

  return (
    <PageShell
      title={lineup.name}
      description={`Saved ${lineup.createdAt.toLocaleString()}`}
      width="max-w-4xl"
      actions={
        <>
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
      }
    >
      <ul className="grid grid-cols-5 gap-3">
        {lineup.slots.map((hero, i) => (
          <li
            key={i}
            className="flex flex-col items-center gap-1.5 text-center"
          >
            {hero ? (
              <>
                <HeroPortrait
                  hero={hero}
                  sizes="(max-width: 640px) 18vw, 160px"
                />
                <HeroName
                  hero={hero}
                  className="text-base font-medium"
                  badgeSize={20}
                />
              </>
            ) : (
              <div className="aspect-[81/100] w-full rounded-md border border-dashed" />
            )}
            <span className="text-muted-foreground text-xs">
              {SLOT_LABELS[i]}
            </span>
          </li>
        ))}
      </ul>

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
                    <HeroName
                      hero={hero}
                      className="font-medium"
                      badgeSize={16}
                    />
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
