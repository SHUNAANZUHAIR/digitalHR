import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const settings = await getSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(req) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const settings = await updateSettings({
    checkInDeadline: body.checkInDeadline,
    workingHours: body.workingHours ? Number(body.workingHours) : undefined,
    weekendDays: body.weekendDays,
  });
  return NextResponse.json({ ok: true, settings });
}
