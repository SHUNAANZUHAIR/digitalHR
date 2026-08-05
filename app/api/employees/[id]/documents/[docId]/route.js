import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getEmployeeDocument, deleteEmployeeDocument } from "@/lib/db";

export async function GET(req, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id, docId } = await params;
  if (user.role !== "hr" && Number(id) !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const doc = await getEmployeeDocument(docId);
  if (!doc || doc.user_id !== Number(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const base64 = doc.file_data.includes(",") ? doc.file_data.split(",")[1] : doc.file_data;
  const buffer = Buffer.from(base64, "base64");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": doc.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${doc.name}"`,
    },
  });
}

export async function DELETE(req, { params }) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { docId } = await params;
  await deleteEmployeeDocument(docId);
  return NextResponse.json({ ok: true });
}
