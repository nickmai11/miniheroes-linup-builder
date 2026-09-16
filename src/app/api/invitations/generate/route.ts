import { NextResponse } from "next/server";
import { canEditContent } from "@/lib/editing";
import { generateInvitationCode } from "@/lib/invitations";
import { isSameOriginInvitationRequest } from "@/lib/invitation-policy";
import { privateInvitationResponse } from "@/lib/invitation-cookie";
import { db, schema } from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { reportAccessError } from "@/lib/access-error";

export async function POST(request: Request) {
  if (!(await canEditContent()))
    return new NextResponse("Not found", { status: 404 });
  if (!isSameOriginInvitationRequest(request)) {
    return privateInvitationResponse(
      NextResponse.json({ error: "Invalid request origin." }, { status: 403 }),
    );
  }
  let lineupId: number | null = null;
  try {
    if (Number(request.headers.get("content-length")) > 1024) throw new Error();
    const raw = await request.text();
    if (raw.length > 1024) throw new Error();
    const body = raw ? JSON.parse(raw) : {};
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    if (Object.hasOwn(body, "lineupId")) {
      if (
        typeof body.lineupId !== "number" ||
        !Number.isInteger(body.lineupId) ||
        body.lineupId < 1 ||
        body.lineupId > 2147483647
      )
        throw new Error();
      lineupId = body.lineupId;
    }
  } catch {
    return privateInvitationResponse(
      NextResponse.json(
        { error: "Invalid invitation request." },
        { status: 400 },
      ),
    );
  }
  try {
    if (lineupId !== null) {
      const [lineup] = await db
        .select({ id: schema.lineups.id })
        .from(schema.lineups)
        .where(
          and(
            eq(schema.lineups.id, lineupId),
            isNull(schema.lineups.privateOwnerId),
          ),
        )
        .limit(1);
      if (!lineup)
        return privateInvitationResponse(
          NextResponse.json({ error: "Lineup not found." }, { status: 404 }),
        );
    }
    const code = await generateInvitationCode(lineupId);
    return privateInvitationResponse(
      NextResponse.json({ code }, { status: 201 }),
    );
  } catch (error) {
    reportAccessError("invitation-generation", error);
    return privateInvitationResponse(
      NextResponse.json(
        { error: "Could not generate a code. Please try again." },
        { status: 503 },
      ),
    );
  }
}
