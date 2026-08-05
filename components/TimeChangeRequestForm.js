"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, X } from "lucide-react";

export default function TimeChangeRequestForm({ attendanceId, date, currentCheckIn }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ requestedCheckIn: currentCheckIn || "", reason: "" });

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/time-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendanceId, date, currentCheckIn, ...form }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
        <Clock3 className="w-3 h-3" /> Request change
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 px-4" onClick={() => setOpen(false)}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-900">Request time change</h3>
          <button type="button" onClick={() => setOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <p className="text-xs text-slate-500">For {date} — current check-in {currentCheckIn || "—"}</p>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Requested check-in time</label>
          <input type="time" required value={form.requestedCheckIn} onChange={(e) => setForm((f) => ({ ...f, requestedCheckIn: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Reason</label>
          <textarea required rows={3} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition">
          {loading ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </div>
  );
}
