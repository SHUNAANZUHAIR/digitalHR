import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listHolidays, addHoliday } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const holidays = await listHolidays();
  return NextResponse.json({ ok: true, holidays });
}

export async function POST(req) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, startDate, endDate, type } = await req.json();
  if (!name || !startDate) {
    return NextResponse.json({ error: "Name and start date are required." }, { status: 400 });
  }
  const rec = await addHoliday({ name, startDate, endDate, type });
  return NextResponse.json({ ok: true, record: rec });
}
