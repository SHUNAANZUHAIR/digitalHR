import { NextResponse } from "next/server";
import { getUserByEmail, verifyPassword } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(user, password)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  await setSessionCookie(user);
  return NextResponse.json({ ok: true, role: user.role });
}
