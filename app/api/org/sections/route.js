import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addSection } from "@/lib/db";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { departmentId, name } = await req.json();
  if (!name || !departmentId) return NextResponse.json({ error: "Department and name are required." }, { status: 400 });
  const rec = await addSection(departmentId, name);
  return NextResponse.json({ ok: true, record: rec });
}
