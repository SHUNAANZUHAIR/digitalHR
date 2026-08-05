import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addLeaveRequest } from "@/lib/db";

function diffDays(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const ms = e - s;
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { type, startDate, endDate, reason } = await req.json();
  if (!type || !startDate || !endDate) {
    return NextResponse.json({ error: "Type and dates are required." }, { status: 400 });
  }
  const rec = await addLeaveRequest({
    userId: user.id,
    type,
    startDate,
    endDate,
    days: diffDays(startDate, endDate),
    reason: reason || "",
  });
  return NextResponse.json({ ok: true, record: rec });
}
