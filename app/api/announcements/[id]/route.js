import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deleteAnnouncement } from "@/lib/db";

export async function DELETE(req, { params }) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await deleteAnnouncement(id);
  return NextResponse.json({ ok: true });
}
