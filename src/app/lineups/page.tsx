import Link from "next/link";
import { HeroPortrait } from "@/components/hero-portrait";
import { getAllLineups } from "@/lib/lineups";

export const dynamic = "force-dynamic";

export default async function LineupsPage() {
  const lineups = await getAllLineups();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Lineups</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/heroes" className="underline">
            Hero pool
          </Link>
          <Link
            href="/lineups/new"
            className="rounded bg-black px-3 py-1.5 text-white dark:bg-white dark:text-black"
          >
            + New lineup
          </Link>
        </nav>
      </header>

      {lineups.length === 0 ? (
        <p className="text-neutral-500">
          No lineups yet.{" "}
          <Link href="/lineups/new" className="underline">
            Build the first one.
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lineups.map((lineup) => (
            <li
              key={lineup.id}
              className="rounded border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <Link
                href={`/lineups/${lineup.id}`}
                className="flex flex-col gap-3"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-medium">{lineup.name}</h2>
                  <span className="text-xs text-neutral-500">
                    {lineup.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  {lineup.slots.map((hero, i) => (
                    <div key={i} className="w-14">
                      {hero ? (
                        <HeroPortrait hero={hero} sizes="56px" />
                      ) : (
                        <div className="aspect-[81/100] rounded-md border border-dashed border-neutral-300 dark:border-neutral-700" />
                      )}
                    </div>
                  ))}
                </div>
                {lineup.description && (
                  <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {lineup.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
