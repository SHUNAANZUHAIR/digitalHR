import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { clockIn, clockOut } from "@/lib/db";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { action } = await req.json();
  const rec = action === "in" ? await clockIn(user.id) : await clockOut(user.id);
  return NextResponse.json({ ok: true, record: rec });
}
