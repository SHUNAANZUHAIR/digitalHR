import { getSessionUser } from "@/lib/auth";
import { listHolidays, getSettings } from "@/lib/db";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import HolidayForm from "@/components/HolidayForm";
import DeleteHolidayButton from "@/components/DeleteHolidayButton";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function CalendarPage() {
  const user = await getSessionUser();
  const isHr = user.role === "hr";
  const holidays = await listHolidays();
  const settings = await getSettings();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = holidays.filter((h) => h.endDate >= today);
  const past = holidays.filter((h) => h.endDate < today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Working calendar</h1>
          <p className="text-sm text-slate-500 mt-1">Weekends, public holidays and observances.</p>
        </div>
        {isHr && <HolidayForm />}
      </div>

      <Card title="Weekly off days">
        <div className="flex flex-wrap gap-2">
          {DAY_NAMES.map((name, i) => (
            <span
              key={name}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                settings.weekendDays.includes(i) ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {name}
            </span>
          ))}
        </div>
      </Card>

      <Card title="Upcoming holidays">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Dates</th>
                <th className="px-5 py-2 font-medium">Type</th>
                {isHr && <th className="px-5 py-2 font-medium">Action</th>}
              </tr>
            </thead>
            <tbody>
              {upcoming.map((h) => (
                <tr key={h.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-2.5 font-medium text-slate-800">{h.name}</td>
                  <td className="px-5 py-2.5 text-slate-600">
                    {h.startDate === h.endDate ? h.startDate : `${h.startDate} → ${h.endDate}`}
                  </td>
                  <td className="px-5 py-2.5"><StatusBadge status={h.type} /></td>
                  {isHr && <td className="px-5 py-2.5"><DeleteHolidayButton id={h.id} /></td>}
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={isHr ? 4 : 3} className="px-5 py-6 text-center text-slate-400 text-sm">No upcoming holidays.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {past.length > 0 && (
        <Card title="Past holidays">
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <tbody>
                {past.map((h) => (
                  <tr key={h.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-2.5 font-medium text-slate-500">{h.name}</td>
                    <td className="px-5 py-2.5 text-slate-400">
                      {h.startDate === h.endDate ? h.startDate : `${h.startDate} → ${h.endDate}`}
                    </td>
                    <td className="px-5 py-2.5"><StatusBadge status={h.type} /></td>
                    {isHr && <td className="px-5 py-2.5"><DeleteHolidayButton id={h.id} /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
