import { requireAppAccess } from "@/lib/app-access";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { getHeroesWithDetails } from "@/lib/heroes";
import { canEditLocally } from "@/lib/local-editing";
import { getAllPets } from "@/lib/pets";
import { getAllRelics } from "@/lib/relics";
import { getBuildsForHeroes } from "@/lib/builds";
import { LineupBuilder } from "./lineup-builder";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Build a lineup" };

export default async function NewLineupPage(props: PageProps<"/lineups/new">) {
  await requireAppAccess();
  if (!(await canEditLocally())) notFound();
  const [heroes, pets, relics, searchParams] = await Promise.all([
    getHeroesWithDetails(),
    getAllPets(),
    getAllRelics(),
    props.searchParams,
  ]);
  const preselect =
    typeof searchParams.hero === "string" ? searchParams.hero : undefined;
  const builds = await getBuildsForHeroes(heroes.map((hero) => hero.id));
  return (
    <PageShell
      title="Build a lineup"
      description="Choose your heroes, assign their pets and relics, then write up why the team works."
    >
      <LineupBuilder
        heroes={heroes}
        pets={pets}
        relics={relics}
        builds={builds}
        preselectSlug={preselect}
      />
    </PageShell>
  );
}
