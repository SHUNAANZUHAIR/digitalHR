"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, X, ArrowLeft } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function EmployeeSection({ title, employees, onStart, showOT }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 mb-2">{title} ({employees.length})</p>
      {employees.length === 0 ? (
        <p className="text-xs text-slate-400 pb-1">No employees in this group.</p>
      ) : (
        <ul className="space-y-1.5">
          {employees.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-slate-800">{e.name}</p>
                <p className="text-xs text-slate-500">{e.department || "—"}{showOT && e.otHours > 0 ? ` · ${e.otHours}h OT` : ""}</p>
              </div>
              <button type="button" onClick={() => onStart(e)} className="text-xs font-medium text-indigo-600 hover:underline">Start</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProcessStep({ employee, month, year, form, setForm, lateInfo, netPay, submitting, error, onBack, onSubmit, onClose }) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button type="button" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{employee.name}</h3>
        <p className="text-xs text-slate-500">{employee.department || "—"} · {employee.position || "—"}</p>
      </div>
      {error && <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 rounded-lg px-3 py-2.5">
        <div><p className="text-slate-400">Salary month</p><p className="text-slate-700 font-medium">{MONTHS[month - 1]} {year}</p></div>
        <div><p className="text-slate-400">Duration</p><p className="text-slate-700 font-medium">{start} → {end}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Basic salary</label>
          <input type="number" required value={form.basic} onChange={(e) => setForm((f) => ({ ...f, basic: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Allowances</label>
          <input type="number" value={form.allowances} onChange={(e) => setForm((f) => ({ ...f, allowances: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Deductions</label>
        <input type="number" value={form.deductions} onChange={(e) => setForm((f) => ({ ...f, deductions: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        {lateInfo && lateInfo.lateDays > 0 && (
          <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mt-1.5">
            {lateInfo.lateDays} late day{lateInfo.lateDays === 1 ? "" : "s"} this period — suggested pay-cut deduction of MVR {lateInfo.suggestedDeduction.toLocaleString()} has been pre-filled.
          </p>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Bank account number</label>
        <p className={`w-full rounded-lg border px-3 py-2 text-sm ${employee.bankAccountNumber ? "border-slate-200 bg-slate-50 text-slate-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          {employee.bankAccountNumber || "No bank account on file — add it from this employee's profile before processing."}
        </p>
      </div>
      <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2.5">
        <span className="text-xs font-medium text-indigo-700">Final payout</span>
        <span className="text-sm font-semibold text-indigo-900">MVR {netPay.toLocaleString()}</span>
      </div>
      <button type="submit" disabled={submitting || !employee.bankAccountNumber} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 transition">
        {submitting ? "Processing…" : "Process salary"}
      </button>
    </form>
  );
}

export default function GenerateSalaryFlow() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loadingList, setLoadingList] = useState(false);
  const [candidates, setCandidates] = useState(null);
  const [step, setStep] = useState("list");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ basic: "", allowances: "", deductions: "" });
  const [lateInfo, setLateInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || step !== "list") return;
    setLoadingList(true);
    fetch(`/api/salary/generate?month=${month}&year=${year}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCandidates(data))
      .finally(() => setLoadingList(false));
  }, [open, step, month, year]);

  function startProcess(emp) {
    setSelected(emp);
    setForm({ basic: emp.basicSalary ?? "", allowances: emp.defaultAllowances ?? "", deductions: "" });
    setLateInfo(null);
    setError("");
    setStep("process");
    fetch(`/api/attendance/late-count?userId=${emp.id}&month=${month}&year=${year}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setLateInfo(data);
        if (data?.suggestedDeduction) setForm((f) => ({ ...f, deductions: data.suggestedDeduction }));
      })
      .catch(() => {});
  }

  function backToList() {
    setStep("list");
    setSelected(null);
    setLateInfo(null);
    setError("");
  }

  function closeAll() {
    setOpen(false);
    setStep("list");
    setSelected(null);
    setCandidates(null);
    setLateInfo(null);
    setError("");
    setForm({ basic: "", allowances: "", deductions: "" });
  }

  const netPay = (Number(form.basic) || 0) + (Number(form.allowances) || 0) - (Number(form.deductions) || 0);

  async function confirmProcess(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/salary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selected.id,
        month,
        year,
        monthLabel: MONTHS[month - 1],
        basic: form.basic,
        allowances: form.allowances,
        deductions: form.deductions,
        payDate: new Date().toISOString().slice(0, 10),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    closeAll();
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline">
        <PlayCircle className="w-3.5 h-3.5" /> Generate salary
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 px-4" onClick={closeAll}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {step === "list" ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Generate salary</h3>
              <button type="button" onClick={closeAll}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500">Salary is processed one employee at a time. Pick a period, then start an employee below.</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Month</label>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Year</label>
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>

            {loadingList && <p className="text-sm text-slate-400">Loading employees…</p>}

            {!loadingList && candidates && (
              <div className="space-y-4">
                <EmployeeSection title="Attendance regularized — without overtime" employees={candidates.withoutOT} onStart={startProcess} />
                <EmployeeSection title="Attendance regularized — with overtime" employees={candidates.withOT} onStart={startProcess} showOT />
                {(candidates.alreadyGeneratedCount > 0 || candidates.pendingReviewCount > 0) && (
                  <p className="text-[11px] text-slate-400">
                    {candidates.alreadyGeneratedCount > 0 && `${candidates.alreadyGeneratedCount} employee(s) already have a slip for this period. `}
                    {candidates.pendingReviewCount > 0 && `${candidates.pendingReviewCount} excluded — pending attendance review.`}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <ProcessStep
            employee={selected}
            month={month}
            year={year}
            form={form}
            setForm={setForm}
            lateInfo={lateInfo}
            netPay={netPay}
            submitting={submitting}
            error={error}
            onBack={backToList}
            onSubmit={confirmProcess}
            onClose={closeAll}
          />
        )}
      </div>
    </div>
  );
}
