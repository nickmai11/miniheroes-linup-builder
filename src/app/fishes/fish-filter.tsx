"use client";

import { Popover } from "@base-ui/react/popover";
import { ChevronDown } from "lucide-react";
import { useId } from "react";

export function FishFilter({
  label,
  allLabel,
  options,
  selected,
  onChange,
}: {
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const labelId = useId();
  const valueId = useId();
  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label)
    .join(", ");

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={labelId} className="text-muted-foreground text-xs">
        {label}
      </span>
      <Popover.Root>
        <Popover.Trigger
          aria-labelledby={`${labelId} ${valueId}`}
          className="bg-background border-input focus-visible:ring-ring flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md border px-3 text-left text-sm focus-visible:ring-2"
        >
          <span id={valueId} className="min-w-0 flex-1 truncate">
            {selectedLabels || allLabel}
          </span>
          {selected.length > 0 && (
            <span
              aria-hidden
              className="bg-muted shrink-0 rounded px-1.5 text-xs"
            >
              {selected.length}
            </span>
          )}
          <ChevronDown aria-hidden className="size-4 shrink-0" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            side="bottom"
            align="start"
            sideOffset={4}
            collisionPadding={16}
            className="z-50"
          >
            <Popover.Popup
              aria-labelledby={labelId}
              className="bg-popover text-popover-foreground max-h-[min(24rem,var(--available-height))] w-[max(16rem,var(--anchor-width))] max-w-(--available-width) overflow-y-auto overscroll-contain rounded-lg border p-1 shadow-lg outline-none"
            >
              <button
                type="button"
                onClick={() => onChange([])}
                className="hover:bg-muted focus-visible:bg-muted min-h-11 w-full rounded-md px-3 py-2 text-left text-sm font-medium focus-visible:outline-none"
              >
                {allLabel}
              </button>
              <fieldset className="min-w-0 border-t pt-1">
                <legend className="sr-only">{label}</legend>
                {options.map((option) => (
                  <label
                    key={option.value}
                    className="hover:bg-muted flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option.value)}
                      onChange={(event) =>
                        onChange(
                          event.target.checked
                            ? [...selected, option.value]
                            : selected.filter(
                                (value) => value !== option.value,
                              ),
                        )
                      }
                      className="accent-primary size-4 shrink-0"
                    />
                    <span className="min-w-0 break-words">{option.label}</span>
                  </label>
                ))}
              </fieldset>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
