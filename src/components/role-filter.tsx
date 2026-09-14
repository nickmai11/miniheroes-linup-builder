"use client";

import { useI18n } from "@/lib/i18n/client";
import { HERO_ROLES, type Hero } from "@/db/schema";
import { RoleBadge } from "@/components/hero-portrait";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ROLE_LABELS } from "@/lib/hero-labels";

export type RoleFilter = Hero["role"] | "all";

export function RoleFilterGroup({
  value,
  onChange,
}: {
  value: RoleFilter;
  onChange: (next: RoleFilter) => void;
}) {
  const { t } = useI18n();

  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      spacing={0}
      value={[value]}
      onValueChange={(v) => onChange((v[0] as RoleFilter | undefined) ?? "all")}
      aria-label={t("Filter by class")}
    >
      <ToggleGroupItem value="all">{t("All")}</ToggleGroupItem>
      {HERO_ROLES.map((r) => (
        <ToggleGroupItem key={r} value={r} className="gap-1.5">
          <RoleBadge role={r} size={14} />
          {t(ROLE_LABELS[r])}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
