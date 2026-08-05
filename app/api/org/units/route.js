import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addUnit } from "@/lib/db";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { sectionId, name } = await req.json();
  if (!name || !sectionId) return NextResponse.json({ error: "Section and name are required." }, { status: 400 });
  const rec = await addUnit(sectionId, name);
  return NextResponse.json({ ok: true, record: rec });
}
