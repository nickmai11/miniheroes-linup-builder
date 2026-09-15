import { getI18n } from "@/lib/i18n/server";
import { ConfirmAction } from "@/components/confirm-action";
import { hasAppAccess, requirePageAccess } from "@/lib/app-access";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { canEditContent } from "@/lib/editing";
import { deleteNote } from "./actions";
import { NoteForm } from "./note-form";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const { t, formatDate } = await getI18n();

  await requirePageAccess();
  const canEdit = (await canEditContent()) && (await hasAppAccess());
  const rows = await db
    .select()
    .from(schema.notes)
    .orderBy(desc(schema.notes.createdAt));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">{t("Notes")}</h1>
      {canEdit && <NoteForm />}
      <ul className="flex flex-col gap-3">
        {rows.length === 0 && (
          <li className="text-muted-foreground">{t("No notes yet.")}</li>
        )}
        {rows.map((note) => (
          <li
            key={note.id}
            className="bg-card flex items-start justify-between gap-4 rounded-lg border p-4"
          >
            <div>
              <h2 className="font-medium">{note.title}</h2>
              {note.body && (
                <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                  {note.body}
                </p>
              )}
              <p className="text-muted-foreground mt-2 text-xs">
                {formatDate(note.createdAt, true)}
              </p>
            </div>
            {canEdit && (
              <ConfirmAction
                title={t('Delete note "{name}"?', { name: note.title })}
                description="This permanently deletes the note. This cannot be undone."
                action={deleteNote.bind(null, note.id)}
                trigger={
                  <button
                    type="button"
                    className="text-destructive text-sm hover:underline"
                    aria-label={t("Delete {name}", { name: note.title })}
                  >
                    {t("Delete")}
                  </button>
                }
              />
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
