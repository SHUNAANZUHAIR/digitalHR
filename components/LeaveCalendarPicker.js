"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["S","M","T","W","T","F","S"];

function iso(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function LeaveCalendarPicker({ startDate, endDate, onChange }) {
  const [cursor, setCursor] = useState(() => {
    const base = startDate ? new Date(startDate) : new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const [weekendDays, setWeekendDays] = useState([0, 6]);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.ok ? r.json() : null).then((d) => d && setWeekendDays(d.settings.weekendDays)).catch(() => {});
    fetch("/api/holidays").then((r) => r.ok ? r.json() : null).then((d) => d && setHolidays(d.holidays)).catch(() => {});
  }, []);

  const holidaySet = useMemo(() => {
    const set = new Set();
    for (const h of holidays) {
      let d = new Date(h.startDate);
      const end = new Date(h.endDate);
      while (d <= end) {
        set.add(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
      }
    }
    return set;
  }, [holidays]);

  const { year, month } = cursor;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dayClick(d) {
    const clicked = iso(year, month, d);
    if (!startDate || (startDate && endDate)) {
      onChange({ startDate: clicked, endDate: "" });
    } else if (clicked < startDate) {
      onChange({ startDate: clicked, endDate: startDate });
    } else {
      onChange({ startDate, endDate: clicked });
    }
  }

  function inRange(dateStr) {
    if (!startDate) return false;
    if (!endDate) return dateStr === startDate;
    return dateStr >= startDate && dateStr <= endDate;
  }

  const dayCount = startDate && endDate
    ? Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1
    : startDate ? 1 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setCursor((c) => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 })} className="p-1 rounded hover:bg-slate-100">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <p className="text-xs font-medium text-slate-700">{MONTH_NAMES[month]} {year}</p>
        <button type="button" onClick={() => setCursor((c) => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 })} className="p-1 rounded hover:bg-slate-100">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((l, i) => <div key={i} className="text-center text-[10px] text-slate-400 font-medium">{l}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dateStr = iso(year, month, d);
          const dow = new Date(year, month, d).getDay();
          const isWeekend = weekendDays.includes(dow);
          const isHoliday = holidaySet.has(dateStr);
          const selected = inRange(dateStr);
          return (
            <button
              type="button"
              key={i}
              onClick={() => dayClick(d)}
              className={`aspect-square rounded-md text-[11px] flex items-center justify-center transition ${
                selected
                  ? "bg-indigo-600 text-white font-medium"
                  : isHoliday
                  ? "bg-amber-50 text-amber-700"
                  : isWeekend
                  ? "text-slate-300"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
        <span>{startDate ? `${startDate}${endDate ? ` → ${endDate}` : ""}` : "Click a start date"}</span>
        {dayCount > 0 && <span className="font-medium text-indigo-600">{dayCount} day{dayCount === 1 ? "" : "s"}</span>}
      </div>
    </div>
  );
}
