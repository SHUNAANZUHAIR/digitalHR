"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import LeaveCalendarPicker from "@/components/LeaveCalendarPicker";

export default function LeaveRequestForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [form, setForm] = useState({ type: "annual", startDate: "", endDate: "", reason: "" });

  useEffect(() => {
    if (!open) return;
    fetch("/api/leave-types")
      .then((r) => (r.ok ? r.json() : { leaveTypes: [] }))
      .then((data) => setLeaveTypes(data.leaveTypes || []))
      .catch(() => {});
  }, [open]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.startDate || !form.endDate) return;
    setLoading(true);
    await fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setOpen(false);
    setForm({ type: "annual", startDate: "", endDate: "", reason: "" });
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline">
        <Plus className="w-3.5 h-3.5" /> Request leave
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 px-4" onClick={() => setOpen(false)}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-900">Request leave</h3>
          <button type="button" onClick={() => setOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {leaveTypes.length > 0 ? (
              leaveTypes.map((lt) => <option key={lt.id} value={lt.name}>{lt.label}</option>)
            ) : (
              <option value="annual">Annual</option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Plan your leave</label>
          <div className="rounded-lg border border-slate-200 p-2.5">
            <LeaveCalendarPicker
              startDate={form.startDate}
              endDate={form.endDate}
              onChange={({ startDate, endDate }) => setForm((f) => ({ ...f, startDate, endDate }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Reason</label>
          <textarea rows={3} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" />
        </div>
        <button type="submit" disabled={loading || !form.startDate || !form.endDate} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition">
          {loading ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </div>
  );
}
