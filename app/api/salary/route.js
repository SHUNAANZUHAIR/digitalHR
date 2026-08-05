import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addSalarySlip, listEmployees } from "@/lib/db";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user || user.role !== "hr") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const rec = await addSalarySlip({
    userId: Number(body.userId),
    month: Number(body.month),
    monthLabel: body.monthLabel,
    year: Number(body.year),
    basic: Number(body.basic),
    allowances: Number(body.allowances) || 0,
    deductions: Number(body.deductions) || 0,
    netPay: Number(body.basic) + (Number(body.allowances) || 0) - (Number(body.deductions) || 0),
    payDate: body.payDate,
  });
  return NextResponse.json({ ok: true, record: rec });
}
