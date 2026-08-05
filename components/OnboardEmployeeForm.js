"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";

export default function OnboardEmployeeForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    name: "", email: "", password: "", department: "", unit: "", position: "",
    nationalId: "", phone: "", emergencyContactName: "", emergencyContactPhone: "", reportsTo: "",
  });

  useEffect(() => {
    if (!open) return;
    fetch("/api/org/departments")
      .then((r) => (r.ok ? r.json() : { departments: [] }))
      .then((data) => setDepartments(data.departments || []))
      .catch(() => {});
    fetch("/api/employees")
      .then((r) => (r.ok ? r.json() : { employees: [] }))
      .then((data) => setManagers(data.employees || []))
      .catch(() => {});
  }, [open]);

  const units = useMemo(() => {
    const dept = departments.find((d) => d.name === form.department);
    if (!dept) return [];
    return dept.sections.flatMap((s) => s.units.map((u) => ({ id: u.id, label: `${s.name} / ${u.name}`, name: u.name })));
  }, [departments, form.department]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    setOpen(false);
    setForm({
      name: "", email: "", password: "", department: "", unit: "", position: "",
      nationalId: "", phone: "", emergencyContactName: "", emergencyContactPhone: "", reportsTo: "",
    });
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline">
        <UserPlus className="w-3.5 h-3.5" /> Onboard employee
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 px-4" onClick={() => setOpen(false)}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-900">Onboard new employee</h3>
          <button type="button" onClick={() => setOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        {error && <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Full name</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Temporary password</label>
          <input required minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
            {departments.length > 0 ? (
              <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value, unit: "" }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">Select…</option>
                {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            ) : (
              <input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} placeholder="e.g. Engineering" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Unit</label>
            <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} disabled={!form.department || units.length === 0} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400">
              <option value="">{units.length ? "Select…" : "No units set up"}</option>
              {units.map((u) => <option key={u.id} value={u.name}>{u.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Position</label>
          <input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} placeholder="e.g. Software Engineer" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">National ID card number</label>
          <input value={form.nationalId} onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))} placeholder="e.g. A123456" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Contact number</label>
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="e.g. 7712345" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Emergency contact name</label>
            <input value={form.emergencyContactName} onChange={(e) => setForm((f) => ({ ...f, emergencyContactName: e.target.value }))} placeholder="e.g. Aisha (spouse)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Emergency contact number</label>
            <input value={form.emergencyContactPhone} onChange={(e) => setForm((f) => ({ ...f, emergencyContactPhone: e.target.value }))} placeholder="e.g. 7798765" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Reports to <span className="text-rose-500">*</span></label>
          <select required value={form.reportsTo} onChange={(e) => setForm((f) => ({ ...f, reportsTo: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Select reporting manager…</option>
            {managers.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.position || m.role}</option>)}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">Required. This manager will approve this employee's leave and attendance requests.</p>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
