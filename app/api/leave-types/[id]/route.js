import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateLeaveType, deleteLeaveType } from "@/lib/db";

export async function PATCH(req, { params }) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { label, quotaDays } = await req.json();
  const rec = await updateLeaveType(id, label, quotaDays);
  return NextResponse.json({ ok: true, record: rec });
}

export async function DELETE(req, { params }) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await deleteLeaveType(id);
  return NextResponse.json({ ok: true });
}
