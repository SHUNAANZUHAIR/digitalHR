"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function SalaryForm({ employees }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({
    userId: employees[0]?.id || "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    basic: "",
    allowances: "",
    deductions: "",
  });
  const [lateInfo, setLateInfo] = useState(null);

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  useEffect(() => {
    if (!open || !form.userId || !form.month || !form.year) return;
    const controller = new AbortController();
    fetch(`/api/attendance/late-count?userId=${form.userId}&month=${form.month}&year=${form.year}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setLateInfo(data))
      .catch(() => {});
    return () => controller.abort();
  }, [open, form.userId, form.month, form.year]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/salary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        monthLabel: MONTHS[Number(form.month) - 1],
        payDate: new Date().toISOString().slice(0, 10),
      }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline">
        <Plus className="w-3.5 h-3.5" /> Add slip
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 px-4" onClick={() => setOpen(false)}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-900">Add salary slip</h3>
          <button type="button" onClick={() => setOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Employee</label>
          <select value={form.userId} onChange={update("userId")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Month</label>
            <select value={form.month} onChange={update("month")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Year</label>
            <input type="number" value={form.year} onChange={update("year")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Basic pay</label>
          <input type="number" required value={form.basic} onChange={update("basic")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Allowances</label>
            <input type="number" value={form.allowances} onChange={update("allowances")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Deductions</label>
            <input type="number" value={form.deductions} onChange={update("deductions")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>
        {lateInfo && lateInfo.lateDays > 0 && (
          <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
            {lateInfo.lateDays} late day{lateInfo.lateDays === 1 ? "" : "s"} this period — suggested pay-cut deduction: MVR {lateInfo.suggestedDeduction.toLocaleString()}
          </p>
        )}

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition">
          {loading ? "Saving…" : "Save slip"}
        </button>
      </form>
    </div>
  );
}
