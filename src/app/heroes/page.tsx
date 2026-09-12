import Link from "next/link";
import { getAllHeroes } from "@/lib/heroes";
import { HeroPool } from "./hero-pool";

export const dynamic = "force-dynamic";

export default async function HeroesPage() {
  const heroes = await getAllHeroes();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Hero pool</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/lineups" className="underline">
            Lineups
          </Link>
          <Link href="/lineups/new" className="underline">
            Build a lineup
          </Link>
        </nav>
      </header>
      <HeroPool heroes={heroes} />
    </main>
  );
}
