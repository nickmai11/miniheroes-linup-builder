"use client";

import { useI18n } from "@/lib/i18n/client";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import {
  AssignmentIcon,
  type AssignmentItem,
} from "@/components/lineup-assignments";

export function AssignmentPicker({
  label,
  heroName,
  items,
  selectedIds,
  onChange,
  disabled = false,
}: {
  label: "Pets" | "Relics";
  heroName: string;
  items: AssignmentItem[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();

  const selected = selectedIds.flatMap((id) => {
    const item = items.find((item) => item.id === id);
    return item ? [item] : [];
  });

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">
        {t(label)}
        {selected.length > 0 ? ` (${selected.length})` : ""}
      </span>
      <Select.Root
        multiple
        modal={false}
        disabled={disabled || items.length === 0}
        value={selectedIds}
        onValueChange={onChange}
        items={items.map((item) => ({ value: item.id, label: item.name }))}
      >
        <Select.Trigger
          aria-label={t("Assign {group} to {name}", {
            group: t(label),
            name: heroName,
          })}
          title={selected.map((item) => item.name).join(", ") || undefined}
          className="bg-background hover:bg-muted focus-visible:ring-ring/50 flex h-10 w-full items-center justify-between gap-2 rounded-md border px-2 text-left text-xs focus-visible:ring-3 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Select.Value className="flex min-w-0 items-center gap-1">
            {selected.length > 0 ? (
              <>
                <span aria-hidden="true" className="flex shrink-0 gap-1">
                  {selected.slice(0, 2).map((item) => (
                    <AssignmentIcon key={item.id} item={item} size={24} />
                  ))}
                </span>
                {selected.length > 2 && (
                  <span aria-hidden="true">+{selected.length - 2}</span>
                )}
                <span className="sr-only">
                  {selected.map((item) => item.name).join(", ")}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground truncate">
                {items.length
                  ? t("Select {group}…", { group: t(label) })
                  : t("No {group} available", { group: t(label) })}
              </span>
            )}
          </Select.Value>
          <Select.Icon className="shrink-0">
            <ChevronDown className="size-3.5" />
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
              aria-label={t("{group} for {name}", {
                group: t(label),
                name: heroName,
              })}
              className="bg-popover text-popover-foreground max-h-[min(18rem,var(--available-height))] w-64 max-w-(--available-width) min-w-(--anchor-width) overflow-y-auto overscroll-contain rounded-md border p-1 shadow-lg outline-none"
            >
              {items.map((item) => (
                <Select.Item
                  key={item.id}
                  value={item.id}
                  label={item.name}
                  className="data-highlighted:bg-accent data-highlighted:text-accent-foreground flex min-h-10 cursor-default items-center gap-2 rounded px-2 py-1.5 text-sm outline-none select-none"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    <Select.ItemIndicator>
                      <Check className="size-4" />
                    </Select.ItemIndicator>
                  </span>
                  <AssignmentIcon item={item} size={28} />
                  <Select.ItemText>{item.name}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
