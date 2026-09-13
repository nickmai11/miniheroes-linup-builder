import { requireAppAccess } from "@/lib/app-access";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { getHeroesWithDetails } from "@/lib/heroes";
import { HeroPool } from "./hero-pool";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Heroes" };

export default async function HeroesPage() {
  await requireAppAccess();
  const heroes = await getHeroesWithDetails();
  return (
    <PageShell title="Hero pool">
      <HeroPool heroes={heroes} />
    </PageShell>
  );
}
