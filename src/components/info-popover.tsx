"use client";

import { Popover } from "@base-ui/react/popover";
import type { ReactElement, ReactNode } from "react";

/** Hover on desktop; press to inspect on touch or with a keyboard. */
export function InfoPopover({
  trigger,
  label,
  children,
  nativeButton = true,
  triggerRole,
}: {
  trigger: ReactElement;
  label: string;
  children: ReactNode;
  nativeButton?: boolean;
  triggerRole?: "option";
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
      <Popover.Portal>
        <Popover.Positioner
          side="right"
          align="start"
          sideOffset={8}
          className="z-[60] outline-none"
        >
          <Popover.Popup
            aria-label={label}
            initialFocus={false}
            className="bg-popover text-popover-foreground max-h-[min(36rem,var(--available-height))] w-80 max-w-(--available-width) overflow-y-auto overscroll-contain rounded-lg border p-4 shadow-xl outline-none"
          >
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
