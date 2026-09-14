"use client";

import { useI18n } from "@/lib/i18n/client";
import { Popover } from "@base-ui/react/popover";
import { ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import { FishPopover } from "@/components/fish-popover";
import { Input } from "@/components/ui/input";
import type { Fish } from "@/db/schema";
import {
  FISH_CATEGORIES,
  MAX_FISH_QUANTITY,
  type FishSelection,
} from "@/lib/fish-selection";

export function FishPicker({
  fishes,
  selections,
  onChange,
  disabled,
}: {
  fishes: Fish[];
  selections: FishSelection[];
  onChange: (selections: FishSelection[]) => void;
  disabled: boolean;
}) {
  const { t } = useI18n();

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const quantities = new Map(
    selections.map(({ fishId, quantity }) => [fishId, quantity]),
  );
  const total = selections.reduce(
    (sum, selection) => sum + selection.quantity,
    0,
  );

  function changeQuantity(fishId: number, quantity: number) {
    const next = selections.flatMap((selection) =>
      selection.fishId !== fishId
        ? [selection]
        : quantity > 0
          ? [{ fishId, quantity }]
          : [],
    );
    if (quantity > 0 && !quantities.has(fishId))
      next.push({ fishId, quantity });
    onChange(next);
  }

  return (
    <section
      aria-label={t("Lineup fishes")}
      className="flex min-w-0 flex-col gap-3"
    >
      <h2 className="font-semibold">
        {t("Fishes")}
        {total ? ` (${total})` : ""}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FISH_CATEGORIES.map((category) => {
          const items = fishes.filter((fish) => fish.fishType === category);
          const matches = items.filter((fish) =>
            fish.name.toLowerCase().includes(query),
          );
          const selected = selections.flatMap(({ fishId, quantity }) => {
            const fish = items.find((item) => item.id === fishId);
            return fish ? [{ ...fish, quantity }] : [];
          });
          const count = selected.reduce((sum, fish) => sum + fish.quantity, 0);
          const summary = selected
            .map((fish) => `${fish.name} ×${fish.quantity}`)
            .join(", ");
          return (
            <div key={category} className="flex min-w-0 flex-col gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">
                {t(category)}
                {count ? ` (${count})` : ""}
              </span>
              <Popover.Root
                modal={false}
                open={!disabled && openCategory === category}
                onOpenChange={(open) => {
                  if (open) setSearch("");
                  setOpenCategory((current) =>
                    open ? category : current === category ? null : current,
                  );
                }}
              >
                <Popover.Trigger
                  disabled={disabled || items.length === 0}
                  aria-label={t("Select {category} fishes", {
                    category: t(category),
                  })}
                  title={summary || undefined}
                  className="bg-background hover:bg-muted focus-visible:ring-ring/50 flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-left text-sm focus-visible:ring-3 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="min-w-0 truncate">
                    {selected.length ? (
                      <>
                        <span aria-hidden="true">
                          {selected[0].name} ×{selected[0].quantity}
                          {selected.length > 1
                            ? ` +${selected.length - 1}`
                            : ""}
                        </span>
                        <span className="sr-only">{summary}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        {items.length
                          ? t("Select fishes…")
                          : t("No fishes available")}
                      </span>
                    )}
                  </span>
                  <ChevronDown className="size-4 shrink-0" />
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner
                    align="start"
                    sideOffset={4}
                    className="z-50 outline-none data-closed:invisible"
                  >
                    <Popover.Popup
                      aria-label={t("{category} fishes", {
                        category: t(category),
                      })}
                      initialFocus={(type) => type === "keyboard"}
                      className="bg-popover text-popover-foreground flex max-h-[min(24rem,var(--available-height))] w-80 max-w-(--available-width) min-w-(--anchor-width) flex-col overflow-hidden rounded-md border p-1 shadow-lg outline-none"
                    >
                      <div className="relative shrink-0 border-b p-1 pb-2">
                        <Search
                          aria-hidden="true"
                          className="text-muted-foreground pointer-events-none absolute top-3.5 left-3 size-4"
                        />
                        <Input
                          type="search"
                          aria-label={t("Search {category} fishes", {
                            category: t(category),
                          })}
                          placeholder={t("Search fishes…")}
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          disabled={disabled}
                          className="pl-8"
                        />
                      </div>
                      <ul className="min-h-0 overflow-y-auto overscroll-contain">
                        {matches.map((fish) => {
                          const quantity = quantities.get(fish.id) ?? 0;
                          return (
                            <li
                              key={fish.id}
                              className="hover:bg-accent flex min-h-12 items-center gap-2 rounded px-2 py-1.5 text-sm"
                            >
                              <input
                                type="checkbox"
                                aria-label={fish.name}
                                checked={quantity > 0}
                                disabled={disabled}
                                onChange={(event) =>
                                  changeQuantity(
                                    fish.id,
                                    event.target.checked ? 1 : 0,
                                  )
                                }
                                className="accent-primary focus-visible:outline-ring size-4 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                              />
                              <FishPopover fish={fish} />
                              <select
                                aria-label={t("Quantity of {name}", {
                                  name: fish.name,
                                })}
                                value={quantity || 1}
                                disabled={disabled || quantity === 0}
                                onChange={(event) =>
                                  changeQuantity(
                                    fish.id,
                                    Number(event.target.value),
                                  )
                                }
                                className="bg-background focus-visible:ring-ring/50 h-9 w-16 shrink-0 rounded-md border px-1 text-sm focus-visible:ring-3 focus-visible:outline-none disabled:opacity-40"
                              >
                                {Array.from(
                                  { length: MAX_FISH_QUANTITY },
                                  (_, i) => i + 1,
                                ).map((amount) => (
                                  <option key={amount} value={amount}>
                                    ×{amount}
                                  </option>
                                ))}
                              </select>
                            </li>
                          );
                        })}
                      </ul>
                      {matches.length === 0 && (
                        <p
                          role="status"
                          className="text-muted-foreground px-3 py-4 text-sm"
                        >
                          {t("No fishes found.")}
                        </p>
                      )}
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            </div>
          );
        })}
      </div>
      <p className="text-muted-foreground text-sm">
        {t(
          "Select multiple fishes in each category, with 1–{max} copies of each.",
          { max: MAX_FISH_QUANTITY },
        )}
      </p>
    </section>
  );
}
