"use client";

import { useI18n } from "@/lib/i18n/client";
import Image from "next/image";
import { versioned } from "@/lib/asset-version";

export type AssignmentItem = { id: number; name: string; iconUrl: string };

export function AssignmentIcon({
  item,
  kind,
  size = 32,
}: {
  item: AssignmentItem;
  kind: "pet" | "relic";
  size?: number;
}) {
  const { gameLabel } = useI18n();

  return (
    <Image
      src={versioned(item.iconUrl)}
      alt={gameLabel(kind, item)}
      width={size}
      height={size}
      className="shrink-0 rounded object-contain"
    />
  );
}

/** Shared by saved hero cards and the editor's multi-select controls. */
export function LineupAssignments({
  pets,
  relics,
  compact = false,
}: {
  pets: AssignmentItem[];
  relics: AssignmentItem[];
  compact?: boolean;
}) {
  const { gameLabel, t } = useI18n();

  return (
    <div className="flex w-full flex-col gap-2 text-left">
      {[
        { label: t("Pets"), kind: "pet" as const, items: pets },
        { label: t("Relics"), kind: "relic" as const, items: relics },
      ].map(
        ({ label, kind, items }) =>
          items.length > 0 && (
            <div key={label}>
              {!compact && (
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  {label}
                </p>
              )}
              <ul aria-label={label} className="flex flex-wrap gap-1">
                {items.map((item) => (
                  <li
                    key={item.id}
                    title={gameLabel(kind, item)}
                    className={
                      compact
                        ? ""
                        : "bg-muted/50 flex w-full items-center gap-1.5 rounded p-1 text-xs"
                    }
                  >
                    <AssignmentIcon
                      kind={kind}
                      item={item}
                      size={compact ? 24 : 28}
                    />
                    {!compact && (
                      <span className="min-w-0 break-words">
                        {gameLabel(kind, item)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ),
      )}
    </div>
  );
}
