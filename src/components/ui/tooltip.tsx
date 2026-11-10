"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "cn";

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  );
}

/** Base UI tooltips open on hover/focus only; touch taps toggle them here. */
const TapToggle = React.createContext<{
  setTouch: (touch: boolean) => void;
  isTouch: () => boolean;
  toggle: () => void;
} | null>(null);

function Tooltip({
  open: openProp,
  onOpenChange,
  ...props
}: TooltipPrimitive.Root.Props) {
  const [open, setOpen] = React.useState(false);
  const touch = React.useRef(false);
  const tap = React.useMemo(
    () => ({
      setTouch: (value: boolean) => {
        touch.current = value;
      },
      isTouch: () => touch.current,
      toggle: () => setOpen((value) => !value),
    }),
    [],
  );
  return (
    <TapToggle.Provider value={tap}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={openProp ?? open}
        onOpenChange={(next, details) => {
          // A tap is handled by the trigger's click toggle below.
          if (touch.current && details.reason === "trigger-press") return;
          setOpen(next);
          onOpenChange?.(next, details);
        }}
        {...props}
      />
    </TapToggle.Provider>
  );
}

function TooltipTrigger({
  onPointerDown,
  onClick,
  ...props
}: TooltipPrimitive.Trigger.Props) {
  const tap = React.useContext(TapToggle);
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      onPointerDown={(event) => {
        tap?.setTouch(event.pointerType === "touch");
        onPointerDown?.(event);
      }}
      onClick={(event) => {
        onClick?.(event);
        if (tap?.isTouch()) tap.toggle();
      }}
      {...props}
    />
  );
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "bg-foreground text-background data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md px-3 py-1.5 text-xs has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm",
            className,
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
