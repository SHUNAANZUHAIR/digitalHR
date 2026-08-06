"use client";

import { useState, useMemo } from "react";
import { User, Search } from "lucide-react";
import EmployeeProfileModal from "@/components/EmployeeProfileModal";

const AVATAR_TONES = [
  "bg-indigo-100 text-indigo-600",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-600",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-600",
];

function toneFor(id) {
  return AVATAR_TONES[id % AVATAR_TONES.length];
}

function Avatar({ photo, name, id, size = 48 }) {
  if (photo) {
    return <img src={photo} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold ${toneFor(id)}`}
      style={{ width: size, height: size, fontSize: size / 2.6 }}
    >
      {initials || <User className="w-1/2 h-1/2" />}
    </div>
  );
}

export default function EmployeeGrid({ employees, isHr, currentUserId }) {
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("active");
  const [query, setQuery] = useState("");

  const retiredCount = employees.filter((e) => e.status === "retired").length;
  const activeCount = employees.length - retiredCount;

  const filtered = useMemo(() => {
    const byTab = employees.filter((e) => (tab === "retired" ? e.status === "retired" : e.status !== "retired"));
    const q = query.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter(
      (e) => e.name.toLowerCase().includes(q) || (e.position || "").toLowerCase().includes(q) || (e.department || "").toLowerCase().includes(q)
    );
  }, [employees, tab, query]);

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setTab("active")}
            className={`text-sm font-medium pb-2 border-b-2 transition ${
              tab === "active" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
            }`}
          >
            Active ({activeCount})
          </button>
          {retiredCount > 0 && (
            <button
              onClick={() => setTab("retired")}
              className={`text-sm font-medium pb-2 border-b-2 transition ${
                tab === "retired" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              Retired ({retiredCount})
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees…"
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelectedId(e.id)}
            className={`flex flex-col items-center text-center gap-2 rounded-xl border p-4 hover:border-indigo-200 hover:shadow-sm transition ${
              e.status === "retired" ? "border-slate-100 bg-slate-50 opacity-60" : "border-slate-100 bg-white"
            }`}
          >
            <Avatar photo={null} name={e.name} id={e.id} />
            <div className="min-w-0 w-full">
              <p className="text-sm font-medium text-slate-900 truncate">{e.name}</p>
              <p className="text-xs text-slate-500 truncate">{e.position || "—"}</p>
              <p className="text-[11px] text-slate-400 truncate">{e.department || "—"}</p>
              {e.status === "retired" && (
                <p className="text-[10px] font-medium text-rose-500 mt-1">Retired</p>
              )}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-slate-400 text-sm py-10">
            {query ? "No employees match your search." : "No employees yet."}
          </p>
        )}
      </div>

      {selectedId && (
        <EmployeeProfileModal
          employeeId={selectedId}
          isHr={isHr}
          canEditPhoto={isHr || selectedId === currentUserId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
