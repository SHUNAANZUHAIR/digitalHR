import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateSalaryStatus } from "@/lib/db";

export async function PATCH(req, { params }) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { status } = await req.json();
  if (!["pending", "paid"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const rec = await updateSalaryStatus(id, status);
  return NextResponse.json({ ok: true, record: rec });
}
