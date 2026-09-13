"use client";

import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RUNE_TYPES, type RuneType, type RuneAttribute } from "@/db/schema";
import type { HeroBuild } from "@/lib/build-types";
import {
  BUILD_PRIORITIES,
  BUILD_PRIORITY_LABELS,
  nextBuildPriority,
  sortByBuildPriority,
  type BuildPriority,
} from "@/lib/build-priorities";
import { RUNE_TYPE_LABELS } from "@/lib/hero-labels";
import { cn } from "@/lib/utils";
import { InfoPopover } from "@/components/info-popover";
import { CoreDetails } from "@/components/core-popover";

/** Rune-type label without the trailing " Runes" (shown under a Runes section). */
export function runeTypeShort(type: RuneType) {
  return RUNE_TYPE_LABELS[type].replace(/ Runes$/, "");
}

function groupRunes<T extends RuneAttribute>(runes: T[]): [RuneType, T[]][] {
  return RUNE_TYPES.map((type) => [
    type,
    runes.filter((rune) => rune.runeType === type),
  ]);
}

export function BuildStats({ build }: { build: HeroBuild }) {
  return (
    <div className="flex flex-col gap-4">
      <BuildSection title="Runes">
        {groupRunes(sortByBuildPriority(build.runes)).map(([type, list]) => (
          <AttributeGroup key={type} title={runeTypeShort(type)}>
            {list.length > 0 ? (
              list.map((r) => (
                <Chip key={r.id} title={r.description} priority={r.priority}>
                  {r.name}
                </Chip>
              ))
            ) : (
              <BuildPlaceholder>No attributes selected.</BuildPlaceholder>
            )}
          </AttributeGroup>
        ))}
      </BuildSection>
      <BuildSection title="Weapons">
        {build.weapons.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {sortByBuildPriority(build.weapons).map((w) => (
              <Chip key={w.id} priority={w.priority}>
                {w.name}
              </Chip>
            ))}
          </div>
        ) : (
          <BuildPlaceholder>No weapon attributes selected.</BuildPlaceholder>
        )}
      </BuildSection>
      <BuildSection title="Cores">
        {build.cores.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {sortByBuildPriority(build.cores).map((core) => (
              <Chip
                key={core.id}
                popover={<CoreDetails core={core} />}
                priority={core.priority}
              >
                {core.name}
              </Chip>
            ))}
          </div>
        ) : (
          <BuildPlaceholder>No cores selected.</BuildPlaceholder>
        )}
      </BuildSection>
    </div>
  );
}

export function BuildPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground flex min-h-7 items-center text-xs">
      {children}
    </p>
  );
}

/** Top-level "Runes" / "Weapons" / "Cores" heading for a build's contents. */
export function BuildSection({
  title,
  children,
  onReset,
  resetDisabled,
}: {
  title: string;
  children: React.ReactNode;
  onReset?: () => void;
  resetDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="border-primary bg-primary/10 text-foreground flex items-center justify-between gap-2 rounded-r-md border-l-4 px-3 py-1.5">
        <h4 className="text-base font-bold">{title}</h4>
        {onReset && (
          <ResetButton
            group={title}
            onClick={onReset}
            disabled={resetDisabled}
          />
        )}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export function AttributeGroup({
  title,
  children,
  onReset,
  resetDisabled,
}: {
  title: string;
  children: React.ReactNode;
  onReset?: () => void;
  resetDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-primary text-xs font-medium tracking-wide uppercase">
          {title}
        </span>
        {onReset && (
          <ResetButton
            group={`${title} runes`}
            onClick={onReset}
            disabled={resetDisabled}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function ResetButton({
  group,
  onClick,
  disabled,
}: {
  group: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Reset ${group}`}
      title={`Clear ${group.toLowerCase()} selections`}
      className="text-muted-foreground"
    >
      <RotateCcw aria-hidden data-icon="inline-start" />
      Reset
    </Button>
  );
}

const PRIORITY_STYLES: Record<BuildPriority, string> = {
  important: "border-red-500/45 bg-red-500/10",
  must: "border-amber-500/45 bg-amber-500/10",
  optional: "border-sky-500/40 bg-sky-500/10",
};

function PriorityMarker({ priority }: { priority: BuildPriority }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0",
        priority === "important" &&
          "rotate-45 rounded-[1px] bg-red-600 dark:bg-red-400",
        priority === "must" &&
          "rotate-45 rounded-[1px] bg-amber-600 dark:bg-amber-400",
        priority === "optional" && "rounded-full bg-sky-600 dark:bg-sky-400",
      )}
    />
  );
}

export function PriorityLegend() {
  return (
    <ul
      aria-label="Attribute priority"
      className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-xs"
    >
      {BUILD_PRIORITIES.map((priority) => (
        <li key={priority} className="flex items-center gap-2">
          <PriorityMarker priority={priority} />
          {BUILD_PRIORITY_LABELS[priority]}
        </li>
      ))}
    </ul>
  );
}

/** Colors and marker shapes convey tiers; accessible names also spell them out. */
export function Chip({
  children,
  priority,
  onClick,
  title,
  popover,
}: {
  children: string;
  priority?: BuildPriority;
  onClick?: () => void;
  title?: string;
  popover?: React.ReactNode;
}) {
  const base =
    "inline-flex min-h-7 max-w-full items-center gap-2 rounded-md border px-2 py-1 text-left text-xs leading-4 font-medium";
  const label = priority ? BUILD_PRIORITY_LABELS[priority] : "Not selected";
  const next = nextBuildPriority(priority);
  const action = next ? `Set to ${BUILD_PRIORITY_LABELS[next]}` : "Remove";
  const description = [`${children} — ${label}`, title, onClick ? action : null]
    .filter(Boolean)
    .join("\n");
  const content = (
    <>
      {/* Keep chip width and row wrapping stable across every selection state. */}
      <span
        aria-hidden
        className="inline-flex size-3 shrink-0 items-center justify-center"
      >
        {priority ? (
          <PriorityMarker priority={priority} />
        ) : (
          <Plus className="size-3" />
        )}
      </span>
      <span className="min-w-0 break-words">{children}</span>
    </>
  );
  if (popover) {
    return (
      <InfoPopover
        label={`${children} skill`}
        trigger={
          <button
            type="button"
            onClick={onClick}
            aria-pressed={onClick ? priority !== undefined : undefined}
            aria-label={onClick ? `${children}: ${label}. ${action}` : children}
            data-priority={priority}
            className={cn(
              base,
              "focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
              priority
                ? PRIORITY_STYLES[priority]
                : "text-muted-foreground border-dashed",
            )}
          >
            {content}
          </button>
        }
      >
        {popover}
      </InfoPopover>
    );
  }
  if (!onClick) {
    return (
      <span
        className={cn(base, priority && PRIORITY_STYLES[priority])}
        title={description}
        data-priority={priority}
      >
        {content}
        <span className="sr-only">, {label}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={priority !== undefined}
      aria-label={`${children}: ${label}. ${action}`}
      title={description}
      data-priority={priority}
      className={cn(
        base,
        "focus-visible:ring-ring/50 transition-colors focus-visible:ring-3 focus-visible:outline-none",
        priority
          ? PRIORITY_STYLES[priority]
          : "hover:border-primary/60 text-muted-foreground border-dashed bg-transparent",
      )}
    >
      {content}
    </button>
  );
}
