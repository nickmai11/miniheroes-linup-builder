"use client";

import Link from "next/link";
import { History } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import type { ChangeEntry } from "@/lib/change-types";

const EVENTS = {
  created: "Created",
  updated: "Updated",
  imported: "Imported",
  deleted: "Deleted",
};

export function ChangeList({
  entries,
  showTargets = false,
}: {
  entries: ChangeEntry[];
  showTargets?: boolean;
}) {
  const { t, formatDate } = useI18n();
  if (!entries.length)
    return (
      <p className="text-muted-foreground py-3 text-sm">
        {t("No changes recorded yet.")}
      </p>
    );
  return (
    <ol className="divide-y">
      {entries.map((entry) => (
        <li key={entry.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex items-start gap-3">
            <History
              className="text-muted-foreground mt-1 size-4 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="min-w-0 text-sm wrap-break-word">
                  <span className="font-medium">{t(EVENTS[entry.event])}</span>
                  {showTargets && (
                    <>
                      {" · "}
                      {t(entry.kind === "lineup" ? "Lineup" : "Build")}
                      {" · "}
                      {entry.href ? (
                        <Link
                          href={entry.href}
                          className="text-primary hover:underline"
                        >
                          {entry.name}
                        </Link>
                      ) : (
                        entry.name
                      )}
                      {entry.heroName && (
                        <span className="text-muted-foreground">{` (${entry.heroName})`}</span>
                      )}
                    </>
                  )}
                </p>
                <time
                  className="text-muted-foreground text-xs"
                  dateTime={new Date(entry.createdAt).toISOString()}
                >
                  {formatDate(entry.createdAt, true)}
                </time>
              </div>
              <details className="text-sm">
                <summary className="text-muted-foreground hover:text-foreground w-fit cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2">
                  {t("View changes")}{" "}
                  <span aria-hidden="true">({entry.fields.length})</span>
                </summary>
                <dl className="mt-3 space-y-3">
                  {entry.fields.map((field) => (
                    <div
                      key={field.label}
                      className="bg-muted/40 rounded-lg border p-3"
                    >
                      <dt className="mb-2 font-medium">
                        {t(field.label)}
                        {field.selectionChanged && (
                          <span className="text-muted-foreground ml-2 text-xs font-normal">
                            {t("Selection changed")}
                          </span>
                        )}
                      </dt>
                      <dd className="grid gap-3 sm:grid-cols-2">
                        <div className="min-w-0">
                          <p className="text-muted-foreground mb-1 text-xs">
                            {t("Before")}
                          </p>
                          <p className="wrap-break-word whitespace-pre-wrap">
                            {field.before ?? t("None")}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted-foreground mb-1 text-xs">
                            {t("After")}
                          </p>
                          <p className="wrap-break-word whitespace-pre-wrap">
                            {field.after ?? t("None")}
                          </p>
                        </div>
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
