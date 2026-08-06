const STYLES = {
  present: "bg-emerald-50 text-emerald-700",
  approved: "bg-emerald-50 text-emerald-700",
  paid: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  in_progress: "bg-amber-50 text-amber-700",
  not_started: "bg-slate-100 text-slate-600",
  late: "bg-amber-50 text-amber-700",
  absent: "bg-rose-50 text-rose-700",
  rejected: "bg-rose-50 text-rose-700",
  leave: "bg-sky-50 text-sky-700",
  holiday: "bg-slate-100 text-slate-600",
};

const LABELS = {
  in_progress: "In progress",
  not_started: "Not started",
};

export default function StatusBadge({ status, label: labelOverride }) {
  const cls = STYLES[status] || "bg-slate-100 text-slate-600";
  const label = labelOverride || LABELS[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : "—");
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}
