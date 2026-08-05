"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

export default function ServiceRequestForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: "cash_advance", amount: "", details: "" });

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setOpen(false);
    setForm({ type: "cash_advance", amount: "", details: "" });
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline">
        <Plus className="w-3.5 h-3.5" /> New request
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 px-4" onClick={() => setOpen(false)}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-900">New admin request</h3>
          <button type="button" onClick={() => setOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="cash_advance">Cash advance</option>
            <option value="equipment">Equipment</option>
            <option value="letter">Employment letter</option>
            <option value="other">Other</option>
          </select>
        </div>
        {form.type === "cash_advance" && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Amount (PKR)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Details</label>
          <textarea required rows={3} value={form.details} onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition">
          {loading ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </div>
  );
}
