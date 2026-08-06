import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addServiceRequest } from "@/lib/db";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { type, amount, details, effectiveDate } = await req.json();
  if (!type || !details) {
    return NextResponse.json({ error: "Type and details are required." }, { status: 400 });
  }
  if (type === "resignation" && !effectiveDate) {
    return NextResponse.json({ error: "Last working day is required for a resignation." }, { status: 400 });
  }
  const rec = await addServiceRequest({
    userId: user.id,
    type,
    amount: amount ? Number(amount) : null,
    details,
    effectiveDate: effectiveDate || null,
  });
  return NextResponse.json({ ok: true, record: rec });
}
