"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

function InlineAdd({ placeholder, onAdd }) {
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
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
        <Plus className="w-3 h-3" /> {placeholder}
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-1.5">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-slate-200 px-2 py-1 text-xs w-40"
      />
      <button type="submit" disabled={loading} className="text-xs font-medium text-indigo-600">Save</button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400">Cancel</button>
    </form>
  );
}

function EditableName({ name, onRename, onDelete }) {
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
      <form onSubmit={submit} className="flex items-center gap-1.5">
        <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1 text-xs" />
        <button type="submit" disabled={loading} className="text-xs font-medium text-indigo-600">Save</button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-slate-400">Cancel</button>
      </form>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 group">
      {name}
      <button type="button" onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition">
        <Pencil className="w-3 h-3" />
      </button>
      <button type="button" onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition">
        <Trash2 className="w-3 h-3" />
      </button>
    </span>
  );
}

function UnitRow({ unit, refresh }) {
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
    <li className="flex items-center gap-2 pl-8 py-1 text-sm text-slate-600">
      <span className="w-1 h-1 rounded-full bg-slate-300" />
      <EditableName name={unit.name} onRename={rename} onDelete={remove} />
    </li>
  );
}

function SectionRow({ section, refresh }) {
  const [expanded, setExpanded] = useState(true);

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
    <li className="py-1.5">
      <div className="flex items-center gap-1.5 pl-4">
        <button type="button" onClick={() => setExpanded((e) => !e)} className="text-slate-400">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <span className="text-sm font-medium text-slate-700">
          <EditableName name={section.name} onRename={rename} onDelete={remove} />
        </span>
      </div>
      {expanded && (
        <ul className="mt-1">
          {section.units.map((u) => <UnitRow key={u.id} unit={u} refresh={refresh} />)}
          <li className="pl-8 pt-1"><InlineAdd placeholder="Add unit" onAdd={addUnit} /></li>
        </ul>
      )}
    </li>
  );
}

function DepartmentCard({ department, refresh }) {
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
    <div className="border border-slate-100 rounded-xl p-4">
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => setExpanded((e) => !e)} className="text-slate-400">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="text-sm font-semibold text-slate-900">
          <EditableName name={department.name} onRename={rename} onDelete={remove} />
        </span>
      </div>
      {expanded && (
        <ul className="mt-1.5">
          {department.sections.map((s) => <SectionRow key={s.id} section={s} refresh={refresh} />)}
          <li className="pl-4 pt-1"><InlineAdd placeholder="Add section" onAdd={addSection} /></li>
        </ul>
      )}
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
    <div className="space-y-3">
      {departments.map((d) => <DepartmentCard key={d.id} department={d} refresh={refresh} />)}
      {departments.length === 0 && <p className="text-sm text-slate-400">No departments yet.</p>}
      <div className="pt-1">
        <InlineAdd placeholder="Add department" onAdd={addDepartment} />
      </div>
    </div>
  );
}
