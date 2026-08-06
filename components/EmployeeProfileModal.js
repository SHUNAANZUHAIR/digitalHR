"use client";

import { useState, useEffect } from "react";
import { X, User, Upload, FileText, Trash2, Download, Pencil } from "lucide-react";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const DOC_TYPES = [
  { value: "contract", label: "Contract" },
  { value: "id", label: "ID document" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
];

export default function EmployeeProfileModal({ employeeId, isHr, canEditPhoto, onClose }) {
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("contract");
  const [docFile, setDocFile] = useState(null);
  const [error, setError] = useState("");
  const [editingPayroll, setEditingPayroll] = useState(false);
  const [payrollSaving, setPayrollSaving] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ basicSalary: "", defaultAllowances: "", bankAccountNumber: "" });

  async function refresh() {
    const [empRes, docsRes] = await Promise.all([
      fetch(`/api/employees/${employeeId}`),
      fetch(`/api/employees/${employeeId}/documents`),
    ]);
    if (empRes.ok) setEmployee((await empRes.json()).employee);
    if (docsRes.ok) setDocuments((await docsRes.json()).documents);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [employeeId]);

  async function onPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setPhotoUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch(`/api/employees/${employeeId}/photo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmployee(data.employee);
    } catch (err) {
      setError(err.message || "Could not upload photo.");
    }
    setPhotoUploading(false);
  }

  function startEditPayroll() {
    setPayrollForm({
      basicSalary: employee.basic_salary ?? "",
      defaultAllowances: employee.default_allowances ?? "",
      bankAccountNumber: employee.bank_account_number || "",
    });
    setEditingPayroll(true);
  }

  async function savePayroll(e) {
    e.preventDefault();
    setPayrollSaving(true);
    const res = await fetch(`/api/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payrollForm),
    });
    if (res.ok) setEmployee((await res.json()).employee);
    setPayrollSaving(false);
    setEditingPayroll(false);
  }

  async function onDocSubmit(e) {
    e.preventDefault();
    if (!docFile || !docName.trim()) return;
    setError("");
    setDocUploading(true);
    try {
      const dataUrl = await fileToDataUrl(docFile);
      const res = await fetch(`/api/employees/${employeeId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: docName.trim(), docType, fileData: dataUrl, mimeType: docFile.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDocName("");
      setDocFile(null);
      await refresh();
    } catch (err) {
      setError(err.message || "Could not upload document.");
    }
    setDocUploading(false);
  }

  async function deleteDoc(id) {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/employees/${employeeId}/documents/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Employee profile</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        {loading && <p className="text-sm text-slate-400">Loading…</p>}

        {!loading && employee && (
          <>
            <div className="flex items-center gap-4">
              <div className="relative">
                {employee.photo ? (
                  <img src={employee.photo} alt={employee.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-semibold">
                    {employee.name.split(" ").map((n) => n[0]).slice(0, 2).join("") || <User className="w-6 h-6" />}
                  </div>
                )}
                {canEditPhoto && (
                  <label className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} disabled={photoUploading} />
                  </label>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900 truncate">{employee.name}</p>
                <p className="text-xs text-slate-500 truncate">{employee.email}</p>
              </div>
            </div>

            {error && <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-slate-400">Department</p><p className="text-slate-700">{employee.department || "—"}</p></div>
              <div><p className="text-xs text-slate-400">Unit</p><p className="text-slate-700">{employee.unit || "—"}</p></div>
              <div><p className="text-xs text-slate-400">Position</p><p className="text-slate-700">{employee.position || "—"}</p></div>
              <div><p className="text-xs text-slate-400">Joined</p><p className="text-slate-700">{employee.join_date || "—"}</p></div>
              <div><p className="text-xs text-slate-400">Role</p><p className="text-slate-700 capitalize">{employee.role}</p></div>
              <div><p className="text-xs text-slate-400">National ID</p><p className="text-slate-700">{employee.national_id || "—"}</p></div>
              <div><p className="text-xs text-slate-400">Contact number</p><p className="text-slate-700">{employee.phone || "—"}</p></div>
              <div><p className="text-xs text-slate-400">Emergency contact</p><p className="text-slate-700">{employee.emergency_contact_name || "—"}</p></div>
              <div><p className="text-xs text-slate-400">Emergency contact number</p><p className="text-slate-700">{employee.emergency_contact_phone || "—"}</p></div>
            </div>

            {isHr && (
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-600">Payroll details</p>
                  {!editingPayroll && (
                    <button type="button" onClick={startEditPayroll} className="text-slate-400 hover:text-indigo-600">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {editingPayroll ? (
                  <form onSubmit={savePayroll} className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Basic salary</label>
                        <input type="number" value={payrollForm.basicSalary} onChange={(e) => setPayrollForm((f) => ({ ...f, basicSalary: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Default allowances</label>
                        <input type="number" value={payrollForm.defaultAllowances} onChange={(e) => setPayrollForm((f) => ({ ...f, defaultAllowances: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Bank account number</label>
                      <input value={payrollForm.bankAccountNumber} onChange={(e) => setPayrollForm((f) => ({ ...f, bankAccountNumber: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="submit" disabled={payrollSaving} className="text-xs font-medium text-indigo-600 disabled:opacity-50">{payrollSaving ? "Saving…" : "Save"}</button>
                      <button type="button" onClick={() => setEditingPayroll(false)} className="text-xs text-slate-400">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-slate-400">Basic salary</p><p className="text-slate-700">{employee.basic_salary != null ? `MVR ${Number(employee.basic_salary).toLocaleString()}` : "—"}</p></div>
                    <div><p className="text-xs text-slate-400">Default allowances</p><p className="text-slate-700">{employee.default_allowances != null ? `MVR ${Number(employee.default_allowances).toLocaleString()}` : "—"}</p></div>
                    <div className="col-span-2"><p className="text-xs text-slate-400">Bank account number</p><p className="text-slate-700">{employee.bank_account_number || "—"}</p></div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-medium text-slate-600 mb-2">Documents</p>
              <ul className="space-y-1.5">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{d.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize shrink-0">{d.docType}</span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <a href={`/api/employees/${employeeId}/documents/${d.id}`} className="text-indigo-600 hover:text-indigo-700">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      {isHr && (
                        <button onClick={() => deleteDoc(d.id)} className="text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  </li>
                ))}
                {documents.length === 0 && <p className="text-xs text-slate-400">No documents uploaded yet.</p>}
              </ul>

              {isHr && (
                <form onSubmit={onDocSubmit} className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="Document name"
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                    />
                    <select value={docType} onChange={(e) => setDocType(e.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs">
                      {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="text-xs flex-1" />
                    <button type="submit" disabled={docUploading || !docFile || !docName.trim()} className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50 disabled:no-underline whitespace-nowrap">
                      {docUploading ? "Uploading…" : "Upload"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
