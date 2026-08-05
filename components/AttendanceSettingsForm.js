"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

export default function AttendanceSettingsForm({ checkInDeadline, workingHours }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ checkInDeadline, workingHours });

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline">
        <Settings className="w-3.5 h-3.5" /> Attendance settings
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 px-4" onClick={() => setOpen(false)}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Attendance settings</h3>
        <p className="text-xs text-slate-500 mb-2">Applies to all employees.</p>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Expected check-in time</label>
          <input type="time" required value={form.checkInDeadline} onChange={(e) => setForm((f) => ({ ...f, checkInDeadline: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <p className="text-[11px] text-slate-400 mt-1">Check-ins after this time are marked "late".</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Working hours per day</label>
          <input type="number" min="1" max="24" step="0.5" required value={form.workingHours} onChange={(e) => setForm((f) => ({ ...f, workingHours: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg py-2.5">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition">
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
