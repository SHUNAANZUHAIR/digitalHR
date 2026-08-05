import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserById } from "@/lib/db";

export async function GET(req, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;
  if (user.role !== "hr" && Number(id) !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const employee = await getUserById(id);
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { passwordHash, ...safe } = employee;
  return NextResponse.json({ ok: true, employee: safe });
}
