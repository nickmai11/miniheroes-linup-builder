"use client";

import { Popover } from "@base-ui/react/popover";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Hover on desktop; press to inspect on touch or with a keyboard. */
export function InfoPopover({
  trigger,
  label,
  children,
  nativeButton = true,
  triggerRole,
  secondaryTrigger,
  side = "right",
  popupClassName,
}: {
  trigger: ReactElement;
  label: string;
  children: ReactNode;
  nativeButton?: boolean;
  triggerRole?: "option" | "link";
  secondaryTrigger?: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  popupClassName?: string;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={trigger}
        nativeButton={nativeButton}
        role={triggerRole}
        openOnHover
        delay={200}
        closeDelay={150}
      />
      {secondaryTrigger && <Popover.Trigger render={secondaryTrigger} />}
      <Popover.Portal>
        <Popover.Positioner
          positionMethod="fixed"
          side={side}
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-[60] outline-none"
        >
          <Popover.Popup
            aria-label={label}
            initialFocus={false}
            className={cn(
              "bg-popover text-popover-foreground max-h-[min(36rem,var(--available-height))] w-80 max-w-(--available-width) [scrollbar-gutter:stable] overflow-y-auto overscroll-contain rounded-lg border p-4 shadow-xl outline-none",
              popupClassName,
            )}
          >
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
