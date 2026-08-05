import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addServiceRequest } from "@/lib/db";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { type, amount, details } = await req.json();
  if (!type || !details) {
    return NextResponse.json({ error: "Type and details are required." }, { status: 400 });
  }
  const rec = await addServiceRequest({
    userId: user.id,
    type,
    amount: amount ? Number(amount) : null,
    details,
  });
  return NextResponse.json({ ok: true, record: rec });
}
