import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateLeaveStatus } from "@/lib/db";

export async function PATCH(req, { params }) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { status, reviewNote } = await req.json();
  const rec = await updateLeaveStatus(id, status, reviewNote);
  return NextResponse.json({ ok: true, record: rec });
}
