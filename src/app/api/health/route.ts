import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { getRegisteredDevice } from "@/lib/app-access";
import { INVITATION_REQUIRED } from "@/lib/invitation-policy";

export async function GET() {
  if (!(await getRegisteredDevice()))
    return NextResponse.json({ error: INVITATION_REQUIRED }, { status: 401 });
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: "up" });
  } catch {
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
