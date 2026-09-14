"use client";

import { useI18n } from "@/lib/i18n/client";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, Eye } from "lucide-react";
import { BuildPopover } from "@/components/build-popover";
import type { HeroBuild } from "@/lib/build-types";

export function BuildPicker({
  heroName,
  builds,
  selectedId,
  onChange,
  disabled,
}: {
  heroName: string;
  builds: HeroBuild[];
  selectedId: number | null;
  onChange: (id: number | null) => void;
  disabled: boolean;
}) {
  const { t } = useI18n();

  const selected = builds.find((build) => build.id === selectedId);
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">
        {t("Build")}
      </span>
      <Select.Root
        value={selectedId}
        onValueChange={onChange}
        disabled={disabled || !builds.length}
        modal={false}
        items={builds.map((build) => ({ value: build.id, label: build.name }))}
      >
        <div className="bg-background flex h-10 items-center rounded-md border">
          {selected && (
            <BuildPopover
              build={selected}
              trigger={
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={t("Preview {name} build stats", {
                    name: selected.name,
                  })}
                  className="text-primary focus-visible:ring-ring/50 flex h-full min-w-0 flex-1 items-center gap-1.5 rounded-l-md px-2 text-left text-xs focus-visible:ring-3"
                >
                  <span className="truncate">{selected.name}</span>
                  <Eye aria-hidden="true" className="size-3.5 shrink-0" />
                </button>
              }
            />
          )}
          <Select.Trigger
            aria-label={t("Choose build for {name}", { name: heroName })}
            className={`hover:bg-muted focus-visible:ring-ring/50 flex h-full items-center justify-between gap-2 rounded-md px-2 text-left text-xs focus-visible:ring-3 focus-visible:outline-none disabled:opacity-50 ${selected ? "shrink-0 border-l" : "w-full"}`}
          >
            <Select.Value
              className={
                selected ? "sr-only" : "text-muted-foreground min-w-0 truncate"
              }
              placeholder={
                builds.length ? t("Select build…") : t("No saved builds")
              }
            />
            <Select.Icon>
              <ChevronDown className="size-3.5 shrink-0" />
            </Select.Icon>
          </Select.Trigger>
        </div>
        <Select.Portal>
          <Select.Positioner
            align="start"
            sideOffset={4}
            alignItemWithTrigger={false}
            className="z-50 outline-none data-closed:invisible"
          >
            <Select.Popup
              aria-label={t("Builds for {name}", { name: heroName })}
              className="bg-popover text-popover-foreground max-h-[min(18rem,var(--available-height))] w-64 max-w-(--available-width) overflow-y-auto overscroll-contain rounded-md border p-1 shadow-lg outline-none"
            >
              <Select.Item
                value={null}
                className="data-highlighted:bg-accent flex min-h-10 cursor-default items-center gap-2 rounded px-2 py-1.5 text-sm outline-none"
              >
                <span className="flex size-4 shrink-0">
                  <Select.ItemIndicator>
                    <Check className="size-4" />
                  </Select.ItemIndicator>
                </span>
                <Select.ItemText>{t("No build")}</Select.ItemText>
              </Select.Item>
              {builds.map((build) => (
                <BuildPopover
                  key={build.id}
                  build={build}
                  nativeButton={false}
                  triggerRole="option"
                  trigger={
                    <Select.Item
                      value={build.id}
                      label={build.name}
                      className="data-highlighted:bg-accent data-highlighted:text-accent-foreground flex min-h-10 cursor-default items-center gap-2 rounded px-2 py-1.5 text-sm outline-none"
                    >
                      <span className="flex size-4 shrink-0">
                        <Select.ItemIndicator>
                          <Check className="size-4" />
                        </Select.ItemIndicator>
                      </span>
                      <Select.ItemText className="min-w-0 flex-1">
                        {build.name}
                      </Select.ItemText>
                      <Eye aria-hidden="true" className="size-3.5 shrink-0" />
                    </Select.Item>
                  }
                />
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
