import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listEmployeeDocuments, addEmployeeDocument } from "@/lib/db";

const MAX_BYTES = 6 * 1024 * 1024; // ~6MB base64 cap

export async function GET(req, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;
  if (user.role !== "hr" && Number(id) !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const documents = await listEmployeeDocuments(id);
  return NextResponse.json({ ok: true, documents });
}

export async function POST(req, { params }) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { name, docType, fileData, mimeType } = await req.json();
  if (!name || !fileData) {
    return NextResponse.json({ error: "Name and file are required." }, { status: 400 });
  }
  if (fileData.length > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max ~4.5MB)." }, { status: 400 });
  }
  const rec = await addEmployeeDocument({ userId: id, name, docType, fileData, mimeType });
  return NextResponse.json({ ok: true, record: rec });
}
