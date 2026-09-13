"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import type { Fish } from "@/db/schema";

export function FishPicker({
  fishes,
  selectedIds,
  onChange,
  disabled,
}: {
  fishes: Fish[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled: boolean;
}) {
  const selected = selectedIds.flatMap((id) => {
    const fish = fishes.find((fish) => fish.id === id);
    return fish ? [fish] : [];
  });

  return (
    <section aria-label="Lineup fishes" className="flex min-w-0 flex-col gap-3">
      <h2 className="font-semibold">
        Fishes{selected.length ? ` (${selected.length})` : ""}
      </h2>
      <Select.Root
        multiple
        modal={false}
        disabled={disabled || fishes.length === 0}
        value={selectedIds}
        onValueChange={onChange}
        items={fishes.map((fish) => ({ value: fish.id, label: fish.name }))}
      >
        <Select.Trigger
          aria-label="Select lineup fishes"
          title={selected.map((fish) => fish.name).join(", ") || undefined}
          className="bg-background hover:bg-muted focus-visible:ring-ring/50 flex h-10 w-full max-w-sm items-center justify-between gap-2 rounded-md border px-3 text-left text-sm focus-visible:ring-3 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Select.Value className="min-w-0 truncate">
            {selected.length ? (
              <>
                {selected[0].name}
                {selected.length > 1 ? ` +${selected.length - 1}` : ""}
                <span className="sr-only">
                  {selected.length > 1
                    ? `, ${selected
                        .slice(1)
                        .map((fish) => fish.name)
                        .join(", ")}`
                    : ""}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {fishes.length ? "Select fishes…" : "No fishes available yet"}
              </span>
            )}
          </Select.Value>
          <Select.Icon className="shrink-0">
            <ChevronDown className="size-4" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            align="start"
            sideOffset={4}
            alignItemWithTrigger={false}
            className="z-50 outline-none data-closed:invisible"
          >
            <Select.Popup
              aria-label="Fishes for this lineup"
              className="bg-popover text-popover-foreground max-h-[min(20rem,var(--available-height))] w-80 max-w-(--available-width) min-w-(--anchor-width) overflow-y-auto overscroll-contain rounded-md border p-1 shadow-lg outline-none"
            >
              {fishes.map((fish) => (
                <Select.Item
                  key={fish.id}
                  value={fish.id}
                  label={fish.name}
                  className="data-highlighted:bg-accent data-highlighted:text-accent-foreground flex min-h-10 cursor-default items-center gap-2 rounded px-2 py-1.5 text-sm outline-none select-none"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    <Select.ItemIndicator>
                      <Check className="size-4" />
                    </Select.ItemIndicator>
                  </span>
                  <Select.ItemText>{fish.name}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <p className="text-muted-foreground text-sm">
        Choose fishes for this lineup. You can select more than one.
      </p>
    </section>
  );
}
