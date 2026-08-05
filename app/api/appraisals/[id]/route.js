import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateAppraisal } from "@/lib/db";

export async function PATCH(req, { params }) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const patch = {};
  if (body.managerRating !== undefined) patch.managerRating = Number(body.managerRating);
  if (body.feedback !== undefined) patch.feedback = body.feedback;
  if (body.status !== undefined) patch.status = body.status;
  const rec = await updateAppraisal(id, patch);
  return NextResponse.json({ ok: true, record: rec });
}
