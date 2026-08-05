import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listLeaveTypes, addLeaveType } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const leaveTypes = await listLeaveTypes();
  return NextResponse.json({ leaveTypes });
}

export async function POST(req) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, label, quotaDays } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  const rec = await addLeaveType(name, label, quotaDays);
  return NextResponse.json({ ok: true, record: rec });
}
