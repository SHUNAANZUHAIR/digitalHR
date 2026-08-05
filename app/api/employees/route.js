import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserByEmail, onboardEmployee } from "@/lib/db";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, email, password, department, position, role, unit } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }
  const rec = await onboardEmployee({ name, email, password, department, position, role, unit });
  return NextResponse.json({ ok: true, record: rec });
}
