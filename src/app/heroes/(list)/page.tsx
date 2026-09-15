import { getI18n } from "@/lib/i18n/server";
import { requirePageAccess } from "@/lib/app-access";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { getHeroesWithDetails } from "@/lib/heroes";
import { HeroPool } from "../hero-pool";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return { title: t("Heroes") };
}

export default async function HeroesPage() {
  const { t } = await getI18n();

  await requirePageAccess();
  const heroes = await getHeroesWithDetails();
  return (
    <PageShell title={t("Heroes")}>
      <HeroPool heroes={heroes} />
    </PageShell>
  );
}
