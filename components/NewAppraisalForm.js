"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

export default function NewAppraisalForm({ employees }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ userId: employees[0]?.id || "", cycle: "", goals: "", dueDate: "" });

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/appraisals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setOpen(false);
    setForm({ userId: employees[0]?.id || "", cycle: "", goals: "", dueDate: "" });
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline">
        <Plus className="w-3.5 h-3.5" /> Start appraisal cycle
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 px-4" onClick={() => setOpen(false)}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-900">Start appraisal cycle</h3>
          <button type="button" onClick={() => setOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Employee</label>
          <select value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Cycle label</label>
          <input required placeholder="e.g. 2026 H2" value={form.cycle} onChange={(e) => setForm((f) => ({ ...f, cycle: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Goals</label>
          <textarea rows={3} value={form.goals} onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Due date</label>
          <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition">
          {loading ? "Starting…" : "Start cycle"}
        </button>
      </form>
    </div>
  );
}
