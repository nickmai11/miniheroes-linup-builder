"use client";

import { ContentVotes } from "@/components/content-votes";
import { useI18n } from "@/lib/i18n/client";
import type { ReactElement } from "react";
import { Eye } from "lucide-react";
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
  const { t } = useI18n();

  return (
    <InfoPopover
      label={t("{name} build stats", { name: build.name })}
      nativeButton={nativeButton}
      triggerRole={triggerRole}
      popupClassName="w-[min(40rem,calc(100vw-2rem))]"
      trigger={
        trigger ?? (
          <button
            type="button"
            aria-label={t("Preview {name} build stats", { name: build.name })}
            className="text-primary focus-visible:ring-ring/50 flex w-full min-w-0 items-center gap-1.5 rounded text-left text-xs font-medium underline decoration-dotted underline-offset-4 focus-visible:ring-3"
          >
            <span className="truncate">{build.name}</span>
            <Eye aria-hidden="true" className="size-3.5 shrink-0" />
          </button>
        )
      }
    >
      <div className="flex flex-col gap-8">
        <div>
          <h3 className="font-semibold">{build.name}</h3>
          {build.notes && (
            <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
              {build.notes}
            </p>
          )}
        </div>
        <ContentVotes kind="build" id={build.id} name={build.name} />
        <PriorityLegend />
        <BuildStats build={build} />
      </div>
    </InfoPopover>
  );
}
