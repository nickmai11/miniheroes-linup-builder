"use client";

import type { ReactElement } from "react";
import { InfoPopover } from "@/components/info-popover";
import { BuildStats, PriorityLegend } from "@/components/build-stats";
import type { HeroBuild } from "@/lib/build-types";

export function BuildPopover({
  build,
  trigger,
  nativeButton = true,
  triggerRole,
}: {
  build: HeroBuild;
  trigger?: ReactElement;
  nativeButton?: boolean;
  triggerRole?: "option";
}) {
  return (
    <InfoPopover
      label={`${build.name} build stats`}
      nativeButton={nativeButton}
      triggerRole={triggerRole}
      trigger={
        trigger ?? (
          <button
            type="button"
            className="text-primary focus-visible:ring-ring/50 w-full truncate rounded text-left text-xs font-medium underline decoration-dotted underline-offset-4 focus-visible:ring-3"
          >
            {build.name}
          </button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-semibold">{build.name}</h3>
          {build.notes && (
            <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
              {build.notes}
            </p>
          )}
        </div>
        <PriorityLegend />
        <BuildStats build={build} />
      </div>
    </InfoPopover>
  );
}
