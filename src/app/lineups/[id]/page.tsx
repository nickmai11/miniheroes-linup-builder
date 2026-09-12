import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroName, HeroPortrait } from "@/components/hero-portrait";
import { getLineup } from "@/lib/lineups";
import { deleteLineup } from "../actions";

export const dynamic = "force-dynamic";

const SLOT_LABELS = ["Front 1", "Front 2", "Back 1", "Back 2", "Back 3"];

export default async function LineupPage(props: PageProps<"/lineups/[id]">) {
  const { id } = await props.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const lineup = await getLineup(numericId);
  if (!lineup) notFound();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{lineup.name}</h1>
          <p className="text-xs text-neutral-500">
            Saved {lineup.createdAt.toLocaleString()}
          </p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/lineups" className="underline">
            All lineups
          </Link>
          <Link href="/lineups/new" className="underline">
            New lineup
          </Link>
          <form action={deleteLineup.bind(null, lineup.id)}>
            <button className="text-red-600 hover:underline">Delete</button>
          </form>
        </nav>
      </header>

      <ul className="grid grid-cols-5 gap-3">
        {lineup.slots.map((hero, i) => (
          <li key={i} className="flex flex-col items-center gap-1 text-center">
            {hero ? (
              <>
                <HeroPortrait
                  hero={hero}
                  sizes="(max-width: 640px) 18vw, 140px"
                  priority
                />
                <HeroName
                  hero={hero}
                  className="text-base font-medium"
                  badgeSize={20}
                />
              </>
            ) : (
              <div className="aspect-[81/100] w-full rounded-md border border-dashed border-neutral-300 dark:border-neutral-700" />
            )}
            <span className="text-[10px] text-neutral-500">
              {SLOT_LABELS[i]}
            </span>
          </li>
        ))}
      </ul>

      {lineup.description ? (
        <section className="rounded border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="mb-2 text-sm font-medium text-neutral-500">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{lineup.description}</p>
        </section>
      ) : null}

      {lineup.slots.some((h) => h?.notes) && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Hero notes</h2>
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
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {hero.notes}
                  </span>
                </p>
              ),
          )}
        </section>
      )}
    </main>
  );
}
