"use client";

import { useActionState } from "react";
import { createNote, type ActionState } from "./actions";

export function NoteForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createNote,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="title"
        placeholder="Title"
        required
        className="rounded border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
      />
      <textarea
        name="body"
        placeholder="Body (optional)"
        rows={3}
        className="rounded border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Saving…" : "Add note"}
      </button>
    </form>
  );
}
