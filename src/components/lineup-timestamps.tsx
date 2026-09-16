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
    <span className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
      <span>
        {t("Created at")}:{" "}
        <time dateTime={createdAt.toISOString()}>
          {formatDate(createdAt, true)}
        </time>
      </span>
      <span>
        {t("Updated at")}:{" "}
        <time dateTime={updatedAt.toISOString()}>
          {formatDate(updatedAt, true)}
        </time>
      </span>
    </span>
  );
}
