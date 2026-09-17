"use client";

import { useActionState, useState } from "react";
import type { Fish } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/client";
import { fishStatMaximum } from "@/lib/fish-measurements";
import { updateFishMeasurements } from "./actions";

export function FishRecordEditor({ fish }: { fish: Fish }) {
  const { t, gameLabel, formatNumber } = useI18n();
  const [bestSize, setBestSize] = useState(String(fish.bestSizeCm ?? ""));
  const [state, action, pending] = useActionState(updateFishMeasurements, {});
  const [edited, setEdited] = useState(false);

  return (
    <details className="border-t pt-3">
      <summary className="cursor-pointer text-sm font-medium">
        {t("Edit highest record")}
      </summary>
      <form
        action={action}
        onChange={() => setEdited(true)}
        onSubmit={() => setEdited(false)}
        className="mt-3 flex flex-col gap-3"
      >
        <input type="hidden" name="id" value={fish.id} />
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs">
            {t("Highest record (cm)")}
            <Input
              name="bestSizeCm"
              type="number"
              min="0.01"
              max="1000000000"
              step="0.01"
              required
              value={bestSize}
              onChange={(event) => setBestSize(event.target.value)}
            />
          </label>
          {!fish.statSample && (
            <p className="text-muted-foreground text-xs">
              {t("Stats will be calculated once a fish sample is added.")}
            </p>
          )}
          <div className="bg-muted rounded-md p-3 text-xs" aria-live="polite">
            <p className="mb-2 font-medium">{t("Calculated max stats")}</p>
            <dl className="flex flex-col gap-1">
              {fish.stats.map((stat) => {
                const percentage = fish.specialStats.includes(stat);
                const maximum = fishStatMaximum(
                  stat,
                  Number(bestSize),
                  fish.statSample,
                  percentage,
                );
                return (
                  <div key={stat} className="flex justify-between gap-2">
                    <dt>{gameLabel("stat", stat)}</dt>
                    <dd className="font-medium tabular-nums">
                      {maximum === null
                        ? "—"
                        : `(${formatNumber(maximum)}${percentage ? "%" : ""})`}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p className="text-muted-foreground mt-2">
              {t("Maximum stats update automatically from the highest record.")}
            </p>
          </div>
          <Button type="submit" size="sm">
            {pending ? t("Saving…") : t("Save highest record")}
          </Button>
        </fieldset>
        {state.error && !edited && !pending && (
          <p role="alert" className="text-destructive text-xs">
            {t(state.error)}
          </p>
        )}
        {state.saved && !edited && !pending && (
          <p role="status" className="text-xs">
            {t("Highest record saved.")}
          </p>
        )}
      </form>
    </details>
  );
}
