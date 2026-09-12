import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { getAllHeroes } from "@/lib/heroes";
import { HeroPool } from "./hero-pool";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Heroes" };

export default async function HeroesPage() {
  const heroes = await getAllHeroes();
  return (
    <PageShell title="Hero pool">
      <HeroPool heroes={heroes} />
    </PageShell>
  );
}
