import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addAppraisal, updateAppraisal } from "@/lib/db";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await req.json();

  if (user.role === "hr") {
    const rec = await addAppraisal({
      userId: Number(body.userId),
      cycle: body.cycle,
      goals: body.goals || "",
      dueDate: body.dueDate,
      status: "in_progress",
    });
    return NextResponse.json({ ok: true, record: rec });
  }

  // employee self-rating submission
  const rec = await updateAppraisal(body.id, { selfRating: Number(body.selfRating) });
  return NextResponse.json({ ok: true, record: rec });
}
