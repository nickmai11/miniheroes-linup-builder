import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    await db.run(sql`select 1`);
    return NextResponse.json({ ok: true, db: "up" });
  } catch (error) {
    return NextResponse.json(
      { ok: false, db: "down", error: String(error) },
      { status: 503 },
    );
  }
}
