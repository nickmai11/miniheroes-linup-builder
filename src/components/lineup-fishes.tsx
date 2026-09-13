import { FISH_CATEGORIES } from "@/lib/fish-selection";
import type { LineupFish } from "@/lib/lineups";

export function LineupFishes({ fishes }: { fishes: LineupFish[] }) {
  if (fishes.length === 0) return null;
  return (
    <div aria-label="Lineup fishes" className="flex min-w-0 flex-col gap-2">
      <p className="text-muted-foreground text-xs font-medium">Fishes</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FISH_CATEGORIES.map((category) => {
          const selected = fishes.filter((fish) => fish.fishType === category);
          if (selected.length === 0) return null;
          return (
            <div
              key={category}
              aria-label={`${category} fishes`}
              className="flex min-w-0 flex-col gap-1.5"
            >
              <p className="text-muted-foreground text-xs">{category}</p>
              <ul className="flex flex-wrap gap-1.5">
                {selected.map((fish) => (
                  <li
                    key={fish.id}
                    className="bg-muted max-w-full rounded-md border px-2 py-1 text-sm break-words"
                  >
                    {fish.name}{" "}
                    <span className="font-medium whitespace-nowrap">
                      ×{fish.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
