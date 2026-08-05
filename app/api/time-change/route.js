import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addTimeChangeRequest } from "@/lib/db";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { attendanceId, date, currentCheckIn, requestedCheckIn, reason } = await req.json();
  if (!attendanceId || !requestedCheckIn) {
    return NextResponse.json({ error: "attendanceId and requestedCheckIn are required." }, { status: 400 });
  }
  const rec = await addTimeChangeRequest({
    userId: user.id,
    attendanceId: Number(attendanceId),
    date,
    currentCheckIn,
    requestedCheckIn,
    reason,
  });
  return NextResponse.json({ ok: true, record: rec });
}
