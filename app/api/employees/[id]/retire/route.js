import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { retireEmployee, reactivateEmployee } from "@/lib/db";

export async function POST(req, { params }) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { retiredDate } = await req.json().catch(() => ({}));
  const rec = await retireEmployee(id, retiredDate);
  const { passwordHash, ...safe } = rec;
  return NextResponse.json({ ok: true, employee: safe });
}

export async function DELETE(req, { params }) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const rec = await reactivateEmployee(id);
  const { passwordHash, ...safe } = rec;
  return NextResponse.json({ ok: true, employee: safe });
}
