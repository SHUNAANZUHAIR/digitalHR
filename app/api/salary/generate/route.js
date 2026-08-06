import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listSalaryGenerationCandidates } from "@/lib/db";

export async function GET(req) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  if (!month || !year) {
    return NextResponse.json({ error: "month and year are required." }, { status: 400 });
  }
  const candidates = await listSalaryGenerationCandidates(month, year);
  return NextResponse.json({ ok: true, ...candidates });
}
