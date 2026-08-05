import { NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req) {
  const { name, email, password, department, position } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }
  const user = await createUser({ name, email, password, department, position });
  await setSessionCookie(user);
  return NextResponse.json({ ok: true, role: user.role });
}
