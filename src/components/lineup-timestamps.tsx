import { getI18n } from "@/lib/i18n/server";

export async function LineupTimestamps({
  createdAt,
  updatedAt,
}: {
  createdAt: Date;
  updatedAt: Date;
}) {
  const { t, formatDate } = await getI18n();
  return (
    <span className="flex flex-wrap gap-x-4 gap-y-1">
      <span className="inline-flex flex-wrap items-baseline gap-x-1">
        <span className="text-muted-foreground text-[11px]">
          {t("Created at")}:
        </span>
        <time
          className="text-foreground text-xs font-medium"
          dateTime={createdAt.toISOString()}
        >
          {formatDate(createdAt, true)}
        </time>
      </span>
      <span className="inline-flex flex-wrap items-baseline gap-x-1">
        <span className="text-muted-foreground text-[11px]">
          {t("Updated at")}:
        </span>
        <time
          className="text-foreground text-xs font-medium"
          dateTime={updatedAt.toISOString()}
        >
          {formatDate(updatedAt, true)}
        </time>
      </span>
    </span>
  );
}
