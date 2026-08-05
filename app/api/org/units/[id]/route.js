import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { renameUnit, deleteUnit } from "@/lib/db";

export async function PATCH(req, { params }) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  const rec = await renameUnit(id, name);
  return NextResponse.json({ ok: true, record: rec });
}

export async function DELETE(req, { params }) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await deleteUnit(id);
  return NextResponse.json({ ok: true });
}
