"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/client";
import { NICKNAME_MAX_LENGTH, nicknameInputSchema } from "@/lib/nickname-input";

export function NicknamePrompt() {
  const { t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const [nickname, setNickname] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (inFlight.current) return;
    const parsed = nicknameInputSchema.safeParse({ nickname });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter your nickname.");
      inputRef.current?.focus();
      return;
    }
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.nickname !== "string") {
        setError(
          result?.error ?? "Could not save your nickname. Please try again.",
        );
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not save your nickname. Please try again.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <Dialog.Root open={!saved} onOpenChange={(_, event) => event.cancel()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-black/60" />
        <Dialog.Viewport className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto p-4">
          <Dialog.Popup
            initialFocus={inputRef}
            className="bg-background text-foreground my-auto w-full max-w-md rounded-2xl border p-6 shadow-2xl outline-none"
          >
            <Dialog.Title className="text-xl font-semibold">
              {t("Choose your nickname")}
            </Dialog.Title>
            <Dialog.Description className="text-muted-foreground mt-2 text-sm">
              {t(
                "Enter a nickname to continue. You only need to do this once.",
              )}
            </Dialog.Description>
            <form
              className="mt-6 flex flex-col gap-4"
              aria-busy={pending}
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="required-nickname">{t("Nickname")}</Label>
                <Input
                  ref={inputRef}
                  id="required-nickname"
                  name="nickname"
                  autoComplete="nickname"
                  required
                  maxLength={NICKNAME_MAX_LENGTH}
                  value={nickname}
                  disabled={pending}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "nickname-error" : undefined}
                  onChange={(event) => {
                    setNickname(event.target.value);
                    setError(null);
                  }}
                />
                {error && (
                  <p
                    id="nickname-error"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {t(error)}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={pending || !nickname.trim()}>
                {pending && (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                )}
                {t(pending ? "Saving…" : "Save and continue")}
              </Button>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
