"use client";

import { useRef, useState, useTransition, type ReactElement } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { unstable_rethrow } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

/** Saved-content mutations run only from the explicit dialog confirmation. */
export function ConfirmAction({
  trigger,
  title,
  description,
  action,
  disabled = false,
  confirmLabel = "Delete",
  pendingLabel = "Deleting…",
}: {
  trigger: ReactElement;
  title: string;
  description: string;
  action: () => Promise<void | { error?: string }>;
  disabled?: boolean;
  confirmLabel?: string;
  pendingLabel?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inFlight = useRef(false);
  const cancelButton = useRef<HTMLButtonElement>(null);

  function confirm() {
    if (!open || disabled || inFlight.current) return;
    inFlight.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (result?.error) setError(result.error);
        else setOpen(false);
      } catch (error) {
        // Lineup deletion redirects; preserve Next.js navigation exceptions.
        unstable_rethrow(error);
        setError("Could not complete the action. Please try again.");
      } finally {
        inFlight.current = false;
      }
    });
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen, event) => {
        if (inFlight.current) {
          event.cancel();
          return;
        }
        setOpen(nextOpen);
        setError(null);
      }}
    >
      <AlertDialog.Trigger render={trigger} disabled={disabled || pending} />
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[80] bg-black/50" />
        <AlertDialog.Viewport className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4">
          <AlertDialog.Popup
            initialFocus={cancelButton}
            className="bg-background text-foreground relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border p-6 shadow-2xl outline-none"
          >
            <AlertDialog.Title className="text-lg font-semibold wrap-break-word">
              {t(title)}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-muted-foreground mt-2 text-sm">
              {t(description)}
            </AlertDialog.Description>
            {error && (
              <p role="alert" className="text-destructive mt-3 text-sm">
                {t(error)}
              </p>
            )}
            <form
              className="mt-6 flex justify-end gap-2"
              aria-busy={pending}
              onSubmit={(event) => {
                event.preventDefault();
                confirm();
              }}
            >
              <AlertDialog.Close
                render={
                  <Button ref={cancelButton} type="button" variant="outline" />
                }
                disabled={pending}
              >
                {t("Cancel")}
              </AlertDialog.Close>
              <Button
                type="submit"
                variant="destructive"
                disabled={disabled || pending}
              >
                {pending && (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                )}
                {t(pending ? pendingLabel : confirmLabel)}
              </Button>
            </form>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
