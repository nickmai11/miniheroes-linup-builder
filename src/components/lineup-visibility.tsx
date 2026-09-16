"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { setLineupVisibility } from "@/app/lineups/actions";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LineupVisibilityToggle({
  isPrivate,
  onChange,
  disabled = false,
}: {
  isPrivate: boolean;
  onChange: (isPrivate: boolean) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const Icon = isPrivate ? EyeOff : Eye;
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button type="button" variant="outline" size="icon" />}
        aria-label={t(isPrivate ? "Show lineup" : "Hide lineup")}
        disabled={disabled}
        onClick={() => onChange(!isPrivate)}
      >
        <Icon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>
        {t(isPrivate ? "Private — only me" : "Visible to visitors with access")}
      </TooltipContent>
    </Tooltip>
  );
}

export function LineupVisibility({
  id,
  isPrivate,
}: {
  id: number;
  isPrivate: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useOptimistic(isPrivate);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1">
      <LineupVisibilityToggle
        isPrivate={selected}
        disabled={pending}
        onChange={(next) => {
          setError(null);
          startTransition(async () => {
            setSelected(next);
            try {
              const result = await setLineupVisibility(id, next);
              if (result.error) setError(result.error);
              else router.refresh();
            } catch {
              setError("Could not update visibility. Please try again.");
            }
          });
        }}
      />
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {t(error)}
        </p>
      )}
    </div>
  );
}
