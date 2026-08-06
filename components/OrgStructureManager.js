"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

function AddTile({ placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    await onAdd(value.trim());
    setLoading(false);
    setValue("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1 min-w-[130px] px-3 py-2.5 rounded-lg border-2 border-dashed border-slate-200 text-xs font-medium text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition"
      >
        <Plus className="w-3.5 h-3.5" /> {placeholder}
      </button>
    );
  }
  return (
    <form
      onSubmit={submit}
      className="flex flex-col items-stretch gap-1.5 min-w-[130px] px-2.5 py-2 rounded-lg border-2 border-indigo-200 bg-white shadow-sm"
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-slate-200 px-2 py-1 text-xs w-full"
      />
      <div className="flex items-center justify-center gap-2">
        <button type="submit" disabled={loading} className="text-xs font-medium text-indigo-600">Save</button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400">Cancel</button>
      </div>
    </form>
  );
}

function NodeLabel({ name, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    await onRename(value.trim());
    setLoading(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="flex flex-col items-stretch gap-1.5">
        <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1 text-xs w-full" />
        <div className="flex items-center justify-center gap-2">
          <button type="submit" disabled={loading} className="text-xs font-medium text-indigo-600">Save</button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-slate-400">Cancel</button>
        </div>
      </form>
    );
  }
  return (
    <div className="flex items-center justify-center gap-1">
      <span>{name}</span>
      <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="text-slate-400 hover:text-indigo-600">
          <Pencil className="w-3 h-3" />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-slate-400 hover:text-red-600">
          <Trash2 className="w-3 h-3" />
        </button>
      </span>
    </div>
  );
}

function UnitNode({ unit, refresh }) {
  async function rename(name) {
    await fetch(`/api/org/units/${unit.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    refresh();
  }
  async function remove() {
    if (!confirm(`Delete unit "${unit.name}"?`)) return;
    await fetch(`/api/org/units/${unit.id}`, { method: "DELETE" });
    refresh();
  }
  return (
    <li>
      <div className="group min-w-[120px] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 text-center">
        <NodeLabel name={unit.name} onRename={rename} onDelete={remove} />
        {typeof unit.employeeCount === "number" && unit.employeeCount > 0 && (
          <span className="mt-1 inline-block text-[10px] font-medium text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">{unit.employeeCount}</span>
        )}
      </div>
    </li>
  );
}

function SectionBranch({ section, refresh }) {
  const [expanded, setExpanded] = useState(true);
  const hasUnits = section.units.length > 0;

  async function rename(name) {
    await fetch(`/api/org/sections/${section.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    refresh();
  }
  async function remove() {
    if (!confirm(`Delete section "${section.name}" and all its units?`)) return;
    await fetch(`/api/org/sections/${section.id}`, { method: "DELETE" });
    refresh();
  }
  async function addUnit(name) {
    await fetch("/api/org/units", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionId: section.id, name }) });
    refresh();
  }

  return (
    <li>
      <div className="group min-w-[140px] px-3 py-2 rounded-lg border border-slate-200 bg-white shadow-sm text-sm font-medium text-slate-700 text-center">
        <div className="flex items-center justify-center gap-1">
          {hasUnits && (
            <button type="button" onClick={() => setExpanded((e) => !e)} className="text-slate-400 shrink-0">
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
          <NodeLabel name={section.name} onRename={rename} onDelete={remove} />
        </div>
      </div>
      {expanded && (
        <ul>
          {section.units.map((u) => <UnitNode key={u.id} unit={u} refresh={refresh} />)}
          <li><AddTile placeholder="Add unit" onAdd={addUnit} /></li>
        </ul>
      )}
    </li>
  );
}

function DepartmentTree({ department, refresh }) {
  const [expanded, setExpanded] = useState(true);

  async function rename(name) {
    await fetch(`/api/org/departments/${department.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    refresh();
  }
  async function remove() {
    if (!confirm(`Delete department "${department.name}" and all its sections/units?`)) return;
    await fetch(`/api/org/departments/${department.id}`, { method: "DELETE" });
    refresh();
  }
  async function addSection(name) {
    await fetch("/api/org/sections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ departmentId: department.id, name }) });
    refresh();
  }

  return (
    <div className="org-tree">
      <ul>
        <li>
          <div className="group min-w-[160px] px-4 py-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 shadow-sm text-sm font-semibold text-slate-900 text-center">
            <div className="flex items-center justify-center gap-1">
              <button type="button" onClick={() => setExpanded((e) => !e)} className="text-indigo-400 shrink-0">
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <NodeLabel name={department.name} onRename={rename} onDelete={remove} />
            </div>
            {typeof department.employeeCount === "number" && (
              <span className="mt-1.5 inline-block text-[10px] font-medium text-indigo-600 bg-white/70 rounded-full px-1.5 py-0.5">
                {department.employeeCount} employee{department.employeeCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {expanded && (
            <ul>
              {department.sections.map((s) => <SectionBranch key={s.id} section={s} refresh={refresh} />)}
              <li><AddTile placeholder="Add section" onAdd={addSection} /></li>
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}

export default function OrgStructureManager({ departments: initial }) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initial);

  async function refresh() {
    const res = await fetch("/api/org/departments");
    if (res.ok) {
      const data = await res.json();
      setDepartments(data.departments);
    }
    router.refresh();
  }

  async function addDepartment(name) {
    await fetch("/api/org/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    refresh();
  }

  return (
    <div>
      <div className="overflow-x-auto -mx-5 px-5 pb-2">
        <div className="flex items-start gap-10 w-max mx-auto">
          {departments.map((d) => <DepartmentTree key={d.id} department={d} refresh={refresh} />)}
          <div className="pt-0.5">
            <AddTile placeholder="Add department" onAdd={addDepartment} />
          </div>
        </div>
      </div>
      {departments.length === 0 && <p className="text-sm text-slate-400 text-center">No departments yet.</p>}

      <style jsx>{`
        .org-tree ul {
          display: flex;
          justify-content: center;
          margin: 0;
          padding: 28px 0 0 0;
          position: relative;
        }
        .org-tree > ul {
          padding-top: 0;
        }
        .org-tree li {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 28px 12px 0 12px;
          list-style: none;
        }
        .org-tree li::before,
        .org-tree li::after {
          content: "";
          position: absolute;
          top: 0;
          right: 50%;
          width: 50%;
          height: 28px;
          border-top: 2px solid #cbd5e1;
        }
        .org-tree li::after {
          right: auto;
          left: 50%;
          border-left: 2px solid #cbd5e1;
        }
        .org-tree li:only-child {
          padding-top: 0;
        }
        .org-tree li:only-child::before,
        .org-tree li:only-child::after {
          display: none;
        }
        .org-tree li:first-child::before,
        .org-tree li:last-child::after {
          border-top: 0 none;
        }
        .org-tree li:last-child::before {
          border-right: 2px solid #cbd5e1;
          border-radius: 0 8px 0 0;
        }
        .org-tree li:first-child::after {
          border-radius: 8px 0 0 0;
        }
        .org-tree ul ul::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          width: 0;
          height: 28px;
          border-left: 2px solid #cbd5e1;
        }
      `}</style>
    </div>
  );
}
