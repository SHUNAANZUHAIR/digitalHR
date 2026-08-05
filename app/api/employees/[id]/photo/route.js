import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateEmployeePhoto } from "@/lib/db";

const MAX_BYTES = 2 * 1024 * 1024; // ~2MB base64 data URL cap

export async function PUT(req, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;
  if (user.role !== "hr" && Number(id) !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { photo } = await req.json();
  if (!photo || typeof photo !== "string" || !photo.startsWith("data:image/")) {
    return NextResponse.json({ error: "A valid image data URL is required." }, { status: 400 });
  }
  if (photo.length > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max ~1.5MB)." }, { status: 400 });
  }
  const rec = await updateEmployeePhoto(id, photo);
  return NextResponse.json({ ok: true, employee: rec });
}
