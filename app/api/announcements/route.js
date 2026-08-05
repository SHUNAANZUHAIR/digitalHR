import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addAnnouncement } from "@/lib/db";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { title, body, priority } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
  const rec = await addAnnouncement({ title, body, priority, postedBy: user.name });
  return NextResponse.json({ ok: true, record: rec });
}
