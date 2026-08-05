import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listOrgStructure, addDepartment } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const departments = await listOrgStructure();
  return NextResponse.json({ ok: true, departments });
}

export async function POST(req) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  const rec = await addDepartment(name);
  return NextResponse.json({ ok: true, record: rec });
}
