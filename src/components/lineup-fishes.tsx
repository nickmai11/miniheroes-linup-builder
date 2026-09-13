import type { Fish } from "@/db/schema";

export function LineupFishes({ fishes }: { fishes: Fish[] }) {
  if (fishes.length === 0) return null;
  return (
    <div aria-label="Lineup fishes" className="flex min-w-0 flex-col gap-2">
      <p className="text-muted-foreground text-xs font-medium">Fishes</p>
      <ul className="flex flex-wrap gap-1.5">
        {fishes.map((fish) => (
          <li
            key={fish.id}
            className="bg-muted rounded-md border px-2 py-1 text-sm break-words"
          >
            {fish.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
