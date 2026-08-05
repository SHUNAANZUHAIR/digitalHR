import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { countLateDays, getSettings } from "@/lib/db";

export async function GET(req) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  if (!userId || !month || !year) {
    return NextResponse.json({ error: "userId, month, and year are required." }, { status: 400 });
  }
  const lateDays = await countLateDays(userId, month, year);
  const settings = await getSettings();
  const suggestedDeduction = lateDays * (settings.lateDeductionPerDay || 0);
  return NextResponse.json({ ok: true, lateDays, suggestedDeduction });
}
