import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { deleteNote } from "./actions";
import { NoteForm } from "./note-form";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const rows = await db
    .select()
    .from(schema.notes)
    .orderBy(desc(schema.notes.createdAt));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">Notes</h1>
      <NoteForm />
      <ul className="flex flex-col gap-3">
        {rows.length === 0 && (
          <li className="text-neutral-500">No notes yet.</li>
        )}
        {rows.map((note) => (
          <li
            key={note.id}
            className="flex items-start justify-between gap-4 rounded border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div>
              <h2 className="font-medium">{note.title}</h2>
              {note.body && (
                <p className="mt-1 text-sm whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
                  {note.body}
                </p>
              )}
              <p className="mt-2 text-xs text-neutral-500">
                {note.createdAt.toLocaleString()}
              </p>
            </div>
            <form action={deleteNote.bind(null, note.id)}>
              <button className="text-sm text-red-600 hover:underline">
                Delete
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
