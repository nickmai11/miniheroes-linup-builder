import { requireAppAccess } from "@/lib/app-access";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { getHeroesWithDetails } from "@/lib/heroes";
import { getLineup } from "@/lib/lineups";
import { canEditContent } from "@/lib/editing";
import { getAllFishes } from "@/lib/fishes";
import { getAllPets } from "@/lib/pets";
import { getAllRelics } from "@/lib/relics";
import { getBuildsForHeroes } from "@/lib/builds";
import { LineupBuilder } from "../../new/lineup-builder";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit lineup" };

export default async function EditLineupPage(
  props: PageProps<"/lineups/[id]/edit">,
) {
  await requireAppAccess();
  if (!(await canEditContent())) notFound();
  const { id } = await props.params;
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) notFound();

  const [lineup, heroes, pets, relics, fishes] = await Promise.all([
    getLineup(numericId),
    getHeroesWithDetails(),
    getAllPets(),
    getAllRelics(),
    getAllFishes(),
  ]);
  if (!lineup) notFound();
  const builds = await getBuildsForHeroes([
    ...new Set([
      ...heroes.map((hero) => hero.id),
      ...lineup.slots.flatMap((hero) => (hero ? [hero.id] : [])),
    ]),
  ]);

  return (
    <PageShell
      title={`Edit ${lineup.name}`}
      description="Update the formation, pets, relics, fishes, and notes for this lineup."
    >
      <LineupBuilder
        key={lineup.id}
        heroes={heroes}
        pets={pets}
        relics={relics}
        builds={builds}
        fishes={fishes}
        lineup={lineup}
      />
    </PageShell>
  );
}
