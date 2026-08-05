"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

export default function HolidayForm({ weekendDays = [] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", type: "holiday", adjustedStartTime: "", adjustedEndTime: "" });
  const [weekend, setWeekend] = useState(weekendDays);

  const DAYS = [
    { v: 0, l: "Sun" }, { v: 1, l: "Mon" }, { v: 2, l: "Tue" }, { v: 3, l: "Wed" },
    { v: 4, l: "Thu" }, { v: 5, l: "Fri" }, { v: 6, l: "Sat" },
  ];

  function toggleDay(v) {
    setWeekend((w) => (w.includes(v) ? w.filter((d) => d !== v) : [...w, v].sort()));
  }

  function onTypeChange(type) {
    setForm((f) => ({
      ...f,
      type,
      adjustedStartTime: type === "ramadan" && !f.adjustedStartTime ? "09:00" : f.adjustedStartTime,
      adjustedEndTime: type === "ramadan" && !f.adjustedEndTime ? "13:30" : f.adjustedEndTime,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setOpen(false);
    setForm({ name: "", startDate: "", endDate: "", type: "holiday", adjustedStartTime: "", adjustedEndTime: "" });
    router.refresh();
  }

  async function saveWeekend() {
    setLoading(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekendDays: weekend }),
    });
    setLoading(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {DAYS.map((d) => (
            <button
              type="button"
              key={d.v}
              onClick={() => toggleDay(d.v)}
              className={`w-8 h-8 rounded-lg text-[11px] font-medium transition ${
                weekend.includes(d.v) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {d.l}
            </button>
          ))}
          <button type="button" onClick={saveWeekend} disabled={loading} className="text-xs font-medium text-indigo-600 hover:underline ml-1 disabled:opacity-50">
            Save weekend
          </button>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline">
          <Plus className="w-3.5 h-3.5" /> Add holiday
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 px-4" onClick={() => setOpen(false)}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-900">Add holiday</h3>
          <button type="button" onClick={() => setOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="e.g. Ramadan" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select value={form.type} onChange={(e) => onTypeChange(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="holiday">Public holiday</option>
            <option value="ramadan">Ramadan</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Start date</label>
            <input type="date" required value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">End date</label>
            <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>

        {form.type === "ramadan" && (
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 space-y-2">
            <p className="text-[11px] text-indigo-700">Shortened hours for this period. Salary/payout is unaffected — only attendance timing changes.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Adjusted start</label>
                <input type="time" value={form.adjustedStartTime} onChange={(e) => setForm((f) => ({ ...f, adjustedStartTime: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Adjusted end</label>
                <input type="time" value={form.adjustedEndTime} onChange={(e) => setForm((f) => ({ ...f, adjustedEndTime: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white" />
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition">
          {loading ? "Saving…" : "Add holiday"}
        </button>
      </form>
    </div>
  );
}
