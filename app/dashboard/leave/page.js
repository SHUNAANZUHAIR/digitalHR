import { getSessionUser } from "@/lib/auth";
import { listLeaveForUser, listAllLeave, listLeaveForManager } from "@/lib/db";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import LeaveRequestForm from "@/components/LeaveRequestForm";
import ReviewButtons from "@/components/ReviewButtons";

export default async function LeavePage() {
  const user = await getSessionUser();
  const isHr = user.role === "hr";
  const requests = isHr ? await listAllLeave() : await listLeaveForUser(user.id);
  const teamRequests = !isHr ? await listLeaveForManager(user.id) : [];
  const pendingTeamRequests = teamRequests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Leave</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isHr ? "Review and approve employee leave requests." : "Request time off and track approvals."}
          </p>
        </div>
        {!isHr && <LeaveRequestForm />}
      </div>

      {!isHr && teamRequests.length > 0 && (
        <Card title="Team approvals" subtitle="Leave requests from employees who report to you.">
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-2 font-medium">Employee</th>
                  <th className="px-5 py-2 font-medium">Type</th>
                  <th className="px-5 py-2 font-medium">Dates</th>
                  <th className="px-5 py-2 font-medium">Days</th>
                  <th className="px-5 py-2 font-medium">Reason</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {teamRequests.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-2.5 font-medium text-slate-800">{r.user.name}</td>
                    <td className="px-5 py-2.5 text-slate-600 capitalize">{r.type}</td>
                    <td className="px-5 py-2.5 text-slate-600">{r.startDate} → {r.endDate}</td>
                    <td className="px-5 py-2.5 text-slate-600">{r.days}</td>
                    <td className="px-5 py-2.5 text-slate-600 max-w-[220px] truncate">{r.reason || "—"}</td>
                    <td className="px-5 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-2.5">
                      {r.status === "pending" ? <ReviewButtons endpoint="/api/leave" id={r.id} /> : <span className="text-xs text-slate-400">Reviewed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                {isHr && <th className="px-5 py-2 font-medium">Employee</th>}
                <th className="px-5 py-2 font-medium">Type</th>
                <th className="px-5 py-2 font-medium">Dates</th>
                <th className="px-5 py-2 font-medium">Days</th>
                <th className="px-5 py-2 font-medium">Reason</th>
                <th className="px-5 py-2 font-medium">Status</th>
                {isHr && <th className="px-5 py-2 font-medium">Action</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0">
                  {isHr && <td className="px-5 py-2.5 font-medium text-slate-800">{r.user.name}</td>}
                  <td className="px-5 py-2.5 text-slate-600 capitalize">{r.type}</td>
                  <td className="px-5 py-2.5 text-slate-600">{r.startDate} → {r.endDate}</td>
                  <td className="px-5 py-2.5 text-slate-600">{r.days}</td>
                  <td className="px-5 py-2.5 text-slate-600 max-w-[220px] truncate">{r.reason || "—"}</td>
                  <td className="px-5 py-2.5"><StatusBadge status={r.status} /></td>
                  {isHr && (
                    <td className="px-5 py-2.5">
                      {r.status === "pending" ? <ReviewButtons endpoint="/api/leave" id={r.id} /> : <span className="text-xs text-slate-400">Reviewed</span>}
                    </td>
                  )}
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={isHr ? 7 : 5} className="px-5 py-6 text-center text-slate-400 text-sm">No leave requests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
