import { getSessionUser } from "@/lib/auth";
import { listAttendanceForUser, listAllAttendance, getTodayAttendance } from "@/lib/db";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import ClockButton from "@/components/ClockButton";

export default async function AttendancePage() {
  const user = await getSessionUser();
  const isHr = user.role === "hr";
  const records = isHr ? await listAllAttendance() : await listAttendanceForUser(user.id);
  const today = !isHr ? await getTodayAttendance(user.id) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isHr ? "Attendance records across the team." : "Track your daily check-in and check-out."}
        </p>
      </div>

      {!isHr && (
        <Card title="Today">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-xs text-slate-500">Check-in</p>
                <p className="font-medium text-slate-900">{today?.checkIn || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Check-out</p>
                <p className="font-medium text-slate-900">{today?.checkOut || "—"}</p>
              </div>
            </div>
            <ClockButton checkedIn={!!today?.checkIn} checkedOut={!!today?.checkOut} />
          </div>
        </Card>
      )}

      <Card title={isHr ? "All records" : "History"}>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                {isHr && <th className="px-5 py-2 font-medium">Employee</th>}
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-5 py-2 font-medium">Check-in</th>
                <th className="px-5 py-2 font-medium">Check-out</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0">
                  {isHr && <td className="px-5 py-2.5 font-medium text-slate-800">{r.user.name}</td>}
                  <td className="px-5 py-2.5 text-slate-600">{r.date}</td>
                  <td className="px-5 py-2.5 text-slate-600">{r.checkIn || "—"}</td>
                  <td className="px-5 py-2.5 text-slate-600">{r.checkOut || "—"}</td>
                  <td className="px-5 py-2.5"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-400 text-sm">No records yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
