"use client";

import { useState } from "react";
import { User } from "lucide-react";
import EmployeeProfileModal from "@/components/EmployeeProfileModal";

function Avatar({ photo, name, size = 48 }) {
  if (photo) {
    return <img src={photo} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <div
      className="rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold"
      style={{ width: size, height: size, fontSize: size / 2.6 }}
    >
      {initials || <User className="w-1/2 h-1/2" />}
    </div>
  );
}

export default function EmployeeGrid({ employees, isHr, currentUserId }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showRetired, setShowRetired] = useState(false);
  const retiredCount = employees.filter((e) => e.status === "retired").length;
  const visible = showRetired ? employees : employees.filter((e) => e.status !== "retired");

  return (
    <>
      {retiredCount > 0 && (
        <label className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} className="rounded" />
          Show retired employees ({retiredCount})
        </label>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visible.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelectedId(e.id)}
            className={`flex flex-col items-center text-center gap-2 rounded-xl border p-4 hover:border-indigo-200 hover:shadow-sm transition ${
              e.status === "retired" ? "border-slate-100 bg-slate-50 opacity-60" : "border-slate-100 bg-white"
            }`}
          >
            <Avatar photo={null} name={e.name} />
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
        {visible.length === 0 && (
          <p className="col-span-full text-center text-slate-400 text-sm py-6">No employees yet.</p>
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
