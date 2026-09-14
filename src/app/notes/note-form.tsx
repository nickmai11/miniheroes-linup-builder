"use client";

import { useI18n } from "@/lib/i18n/client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createNote, type ActionState } from "./actions";

export function NoteForm() {
  const { t } = useI18n();

  const [state, action, pending] = useActionState<ActionState, FormData>(
    createNote,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <Input name="title" placeholder={t("Title")} required />
      <Textarea name="body" placeholder={t("Body (optional)")} rows={3} />
      {state.error && (
        <p className="text-destructive text-sm">{t(state.error)}</p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t("Saving…") : t("Add note")}
      </Button>
    </form>
  );
}
