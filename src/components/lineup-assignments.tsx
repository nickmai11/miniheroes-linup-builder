import Image from "next/image";
import { versioned } from "@/lib/asset-version";

export type AssignmentItem = { id: number; name: string; iconUrl: string };

export function AssignmentIcon({
  item,
  size = 32,
}: {
  item: AssignmentItem;
  size?: number;
}) {
  return (
    <Image
      src={versioned(item.iconUrl)}
      alt={item.name}
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
  return (
    <div className="flex w-full flex-col gap-2 text-left">
      {[
        { label: "Pets", items: pets },
        { label: "Relics", items: relics },
      ].map(
        ({ label, items }) =>
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
                    title={item.name}
                    className={
                      compact
                        ? ""
                        : "bg-muted/50 flex w-full items-center gap-1.5 rounded p-1 text-xs"
                    }
                  >
                    <AssignmentIcon item={item} size={compact ? 24 : 28} />
                    {!compact && (
                      <span className="min-w-0 break-words">{item.name}</span>
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
