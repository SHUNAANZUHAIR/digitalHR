import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { clockIn, clockOut, breakIn, breakOut } from "@/lib/db";

const ACTIONS = { in: clockIn, out: clockOut, break_in: breakIn, break_out: breakOut };

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { action } = await req.json();
  const handler = ACTIONS[action];
  if (!handler) return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  const rec = await handler(user.id);
  return NextResponse.json({ ok: true, record: rec });
}
