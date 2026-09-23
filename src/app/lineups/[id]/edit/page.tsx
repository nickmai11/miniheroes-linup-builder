import { getI18n } from "@/lib/i18n/server";
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
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return { title: t("Edit lineup") };
}

export default async function EditLineupPage(
  props: PageProps<"/lineups/[id]/edit">,
) {
  const { t } = await getI18n();

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
  if (!lineup?.canManage) notFound();
  const builds = await getBuildsForHeroes([
    ...new Set([
      ...heroes.map((hero) => hero.id),
      ...lineup.slots.flatMap((hero) => (hero ? [hero.id] : [])),
    ]),
  ]);

  return (
    <PageShell
      title={t("Edit {name}", { name: lineup.name })}
      description={t(
        "Update the formation, pets, relics, fishes, and notes for this lineup.",
      )}
    >
      <LineupBuilder
        key={lineup.id}
        heroes={heroes}
        pets={pets}
        relics={relics}
        builds={builds.filter((build) => build.canManage)}
        fishes={fishes}
        lineup={lineup}
      />
    </PageShell>
  );
}
