import { getSessionUser } from "@/lib/auth";
import { listServicesForUser, listAllServices } from "@/lib/db";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import ServiceRequestForm from "@/components/ServiceRequestForm";
import ReviewButtons from "@/components/ReviewButtons";

function money(n) {
  return n ? `PKR ${Number(n).toLocaleString()}` : "—";
}

export default async function ServicesPage() {
  const user = await getSessionUser();
  const isHr = user.role === "hr";
  const requests = isHr ? await listAllServices() : await listServicesForUser(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Admin requests</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isHr ? "Review cash advance and admin service requests." : "Request cash advances and other admin services."}
          </p>
        </div>
        {!isHr && <ServiceRequestForm />}
      </div>

      <Card>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                {isHr && <th className="px-5 py-2 font-medium">Employee</th>}
                <th className="px-5 py-2 font-medium">Type</th>
                <th className="px-5 py-2 font-medium">Amount</th>
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-5 py-2 font-medium">Details</th>
                <th className="px-5 py-2 font-medium">Status</th>
                {isHr && <th className="px-5 py-2 font-medium">Action</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0">
                  {isHr && <td className="px-5 py-2.5 font-medium text-slate-800">{r.user.name}</td>}
                  <td className="px-5 py-2.5 text-slate-600 capitalize">{r.type.replace("_", " ")}</td>
                  <td className="px-5 py-2.5 text-slate-600">{money(r.amount)}</td>
                  <td className="px-5 py-2.5 text-slate-600">{r.effectiveDate || "—"}</td>
                  <td className="px-5 py-2.5 text-slate-600 max-w-[220px] truncate">{r.details}</td>
                  <td className="px-5 py-2.5"><StatusBadge status={r.status} /></td>
                  {isHr && (
                    <td className="px-5 py-2.5">
                      {r.status === "pending" ? <ReviewButtons endpoint="/api/services" id={r.id} /> : <span className="text-xs text-slate-400">Reviewed</span>}
                    </td>
                  )}
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={isHr ? 7 : 5} className="px-5 py-6 text-center text-slate-400 text-sm">No requests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
