import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db";
import { canEditContent, EDITING_ERROR } from "@/lib/editing";
import { hasAppAccess } from "@/lib/app-access";
import {
  INVITATION_REQUIRED,
  isSameOriginInvitationRequest,
} from "@/lib/invitation-policy";

const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).default(""),
});

export async function GET() {
  if (!(await hasAppAccess()))
    return NextResponse.json({ error: INVITATION_REQUIRED }, { status: 401 });
  const rows = await db
    .select()
    .from(schema.notes)
    .orderBy(desc(schema.notes.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  if (!(await canEditContent())) {
    return NextResponse.json({ error: EDITING_ERROR }, { status: 403 });
  }
  if (!(await hasAppAccess()))
    return NextResponse.json({ error: INVITATION_REQUIRED }, { status: 401 });
  if (!isSameOriginInvitationRequest(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const parsed = createNoteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }
  const [row] = await db.insert(schema.notes).values(parsed.data).returning();
  return NextResponse.json(row, { status: 201 });
}
