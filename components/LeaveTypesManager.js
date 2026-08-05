"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

function EditableQuota({ leaveType, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(leaveType.label);
  const [quota, setQuota] = useState(leaveType.quotaDays ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(leaveType.id, label, quota);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <tr className="border-b border-slate-50 last:border-0">
        <td className="px-3 py-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm" />
        </td>
        <td className="px-3 py-2 text-xs text-slate-400">{leaveType.name}</td>
        <td className="px-3 py-2">
          <input value={quota} onChange={(e) => setQuota(e.target.value)} placeholder="Unlimited" className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm" />
        </td>
        <td className="px-3 py-2 flex gap-2">
          <button type="button" disabled={saving} onClick={save} className="text-emerald-600"><Check className="w-4 h-4" /></button>
          <button type="button" onClick={() => setEditing(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="px-3 py-2 text-sm font-medium text-slate-800">{leaveType.label}</td>
      <td className="px-3 py-2 text-xs text-slate-400">{leaveType.name}</td>
      <td className="px-3 py-2 text-sm text-slate-600">{leaveType.quotaDays == null ? "Unlimited" : `${leaveType.quotaDays} days/year`}</td>
      <td className="px-3 py-2 flex gap-2">
        <button type="button" onClick={() => setEditing(true)} className="text-slate-400 hover:text-indigo-600"><Pencil className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => onDelete(leaveType.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
      </td>
    </tr>
  );
}

export default function LeaveTypesManager({ leaveTypes }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [quota, setQuota] = useState("");
  const [saving, setSaving] = useState(false);

  async function addType(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/leave-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, label: label || name, quotaDays: quota }),
    });
    setSaving(false);
    setName("");
    setLabel("");
    setQuota("");
    setAdding(false);
    router.refresh();
  }

  async function saveType(id, label, quotaDays) {
    await fetch(`/api/leave-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, quotaDays }),
    });
    router.refresh();
  }

  async function deleteType(id) {
    if (!confirm("Delete this leave type? Existing requests using it will be unaffected.")) return;
    await fetch(`/api/leave-types/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
            <th className="px-3 py-2 font-medium">Label</th>
            <th className="px-3 py-2 font-medium">Key</th>
            <th className="px-3 py-2 font-medium">Annual quota</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaveTypes.map((lt) => (
            <EditableQuota key={lt.id} leaveType={lt} onSave={saveType} onDelete={deleteType} />
          ))}
        </tbody>
      </table>
      <div className="px-3 pt-2">
        {adding ? (
          <form onSubmit={addType} className="flex flex-wrap items-center gap-2">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="key (e.g. maternity)" className="rounded-md border border-slate-200 px-2 py-1.5 text-sm w-40" />
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Display label" className="rounded-md border border-slate-200 px-2 py-1.5 text-sm w-40" />
            <input value={quota} onChange={(e) => setQuota(e.target.value)} placeholder="Quota days (blank = unlimited)" className="rounded-md border border-slate-200 px-2 py-1.5 text-sm w-56" />
            <button type="submit" disabled={saving} className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md px-3 py-1.5">Add</button>
            <button type="button" onClick={() => setAdding(false)} className="text-xs text-slate-400">Cancel</button>
          </form>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add leave type
          </button>
        )}
      </div>
    </div>
  );
}
