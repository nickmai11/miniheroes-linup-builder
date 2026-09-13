import { requireAppAccess } from "@/lib/app-access";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { getHeroesWithDetails } from "@/lib/heroes";
import { getLineup } from "@/lib/lineups";
import { canEditLocally } from "@/lib/local-editing";
import { getAllFishes } from "@/lib/fishes";
import { getAllPets } from "@/lib/pets";
import { getAllRelics } from "@/lib/relics";
import { getBuildsForHeroes } from "@/lib/builds";
import { LineupBuilder } from "./lineup-builder";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Build a lineup" };

export default async function NewLineupPage(props: PageProps<"/lineups/new">) {
  await requireAppAccess();
  if (!(await canEditLocally())) notFound();
  const searchParams = await props.searchParams;
  const cloneId =
    typeof searchParams.clone === "string" ? Number(searchParams.clone) : NaN;
  if (
    searchParams.clone !== undefined &&
    (!Number.isSafeInteger(cloneId) || cloneId <= 0)
  ) {
    notFound();
  }
  const [heroes, pets, relics, fishes, cloneFrom] = await Promise.all([
    getHeroesWithDetails(),
    getAllPets(),
    getAllRelics(),
    getAllFishes(),
    searchParams.clone === undefined ? undefined : getLineup(cloneId),
  ]);
  if (searchParams.clone !== undefined && !cloneFrom) notFound();
  const preselect =
    typeof searchParams.hero === "string" ? searchParams.hero : undefined;
  const builds = await getBuildsForHeroes([
    ...new Set([
      ...heroes.map((hero) => hero.id),
      ...(cloneFrom?.slots.flatMap((hero) => (hero ? [hero.id] : [])) ?? []),
    ]),
  ]);
  return (
    <PageShell
      title={cloneFrom ? "Clone lineup" : "Build a lineup"}
      description={
        cloneFrom
          ? `Start with a copy of ${cloneFrom.name}, make your changes, and save a new lineup.`
          : "Choose your heroes, assign their pets and relics, choose fishes, then write up why the team works."
      }
    >
      <LineupBuilder
        key={cloneFrom ? `clone-${cloneFrom.id}` : (preselect ?? "new")}
        heroes={heroes}
        pets={pets}
        relics={relics}
        builds={builds}
        fishes={fishes}
        preselectSlug={preselect}
        cloneFrom={cloneFrom}
      />
    </PageShell>
  );
}
