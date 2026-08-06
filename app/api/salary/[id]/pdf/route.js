import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionUser } from "@/lib/auth";
import { getSalarySlipById } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ORG_NAME, ORG_NAME_LINE1, ORG_NAME_LINE2, ORG_ADDRESS } from "@/lib/branding";

function money(n) {
  return `MVR ${Number(n || 0).toLocaleString()}`;
}

export async function GET(req, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await params;
  const slip = await getSalarySlipById(id);
  if (!slip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== "hr" && slip.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const indigo = rgb(0.267, 0.220, 0.788);
  const dark = rgb(0.059, 0.09, 0.165);
  const gray = rgb(0.28, 0.34, 0.42);
  const light = rgb(0.58, 0.64, 0.72);

  let logoImg = null;
  try {
    const logoBytes = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
    logoImg = await pdfDoc.embedPng(logoBytes);
  } catch {
    logoImg = null;
  }

  let y = 780;
  const textX = logoImg ? 100 : 50;
  if (logoImg) {
    const logoDim = logoImg.scale(40 / logoImg.width);
    page.drawImage(logoImg, { x: 50, y: y - logoDim.height + 8, width: logoDim.width, height: logoDim.height });
  }
  page.drawText(ORG_NAME_LINE1, { x: textX, y, size: 11, font: bold, color: indigo });
  y -= 14;
  page.drawText(ORG_NAME_LINE2, { x: textX, y, size: 11, font: bold, color: indigo });
  y -= 13;
  page.drawText(ORG_ADDRESS, { x: textX, y, size: 8, font, color: light });
  y -= 26;
  page.drawText(`Salary Slip - ${slip.monthLabel} ${slip.year}`, { x: 50, y, size: 13, font: bold, color: dark });
  y -= 34;

  const details = [
    ["Employee", slip.user.name],
    ["Email", slip.user.email],
    ["Department", slip.user.department || "-"],
    ["Position", slip.user.position || "-"],
    ["Pay date", slip.payDate || "-"],
    ["Status", slip.status],
  ];
  for (const [label, value] of details) {
    page.drawText(`${label}:`, { x: 50, y, size: 10, font, color: gray });
    page.drawText(String(value), { x: 160, y, size: 10, font, color: dark });
    y -= 18;
  }

  y -= 20;
  page.drawLine({ start: { x: 50, y: y + 12 }, end: { x: 545, y: y + 12 }, thickness: 1, color: rgb(0.9, 0.91, 0.93) });
  y -= 10;

  const rows = [
    ["Basic pay", money(slip.basic)],
    ["Allowances", money(slip.allowances)],
    ["Deductions", `-${money(slip.deductions)}`],
    ["Net pay", money(slip.netPay)],
  ];
  for (const [label, value] of rows) {
    const isNet = label === "Net pay";
    page.drawText(label, { x: 50, y, size: 11, font: isNet ? bold : font, color: dark });
    page.drawText(value, { x: 400, y, size: 11, font: bold, color: dark });
    y -= 22;
  }

  y -= 40;
  page.drawText(`This is a system-generated document from the ${ORG_NAME}.`, { x: 50, y, size: 8, font, color: light });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="salary-slip-${slip.monthLabel}-${slip.year}.pdf"`,
    },
  });
}
