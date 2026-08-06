import { getSessionUser } from "@/lib/auth";
import { listSalaryForUser, listAllSalary, listEmployees } from "@/lib/db";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import SalaryForm from "@/components/SalaryForm";
import MarkPaidButton from "@/components/MarkPaidButton";

function money(n) {
  return `MVR ${Number(n).toLocaleString()}`;
}

export default async function SalaryPage() {
  const user = await getSessionUser();
  const isHr = user.role === "hr";
  const [slips, employeesRaw] = await Promise.all([
    isHr ? listAllSalary() : listSalaryForUser(user.id),
    isHr ? listEmployees() : Promise.resolve([]),
  ]);
  const employees = employeesRaw.filter((e) => e.role === "employee");
  const pendingSlips = isHr ? slips.filter((s) => s.status === "pending") : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Salary</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isHr ? "Manage payroll records for the team." : "Your salary slips and payment history."}
        </p>
      </div>

      {isHr && (
        <Card title="Pending payouts" subtitle="Slips awaiting payment. Mark as paid once the transfer is sent.">
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-2 font-medium">Employee</th>
                  <th className="px-5 py-2 font-medium">Period</th>
                  <th className="px-5 py-2 font-medium">Net pay</th>
                  <th className="px-5 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingSlips.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-2.5 font-medium text-slate-800">{s.user.name}</td>
                    <td className="px-5 py-2.5 text-slate-600">{s.monthLabel} {s.year}</td>
                    <td className="px-5 py-2.5 font-medium text-slate-900">{money(s.netPay)}</td>
                    <td className="px-5 py-2.5"><MarkPaidButton id={s.id} /></td>
                  </tr>
                ))}
                {pendingSlips.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-slate-400 text-sm">Nothing pending — all caught up.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title="Salary slips" action={isHr && <SalaryForm employees={employees} />}>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                {isHr && <th className="px-5 py-2 font-medium">Employee</th>}
                <th className="px-5 py-2 font-medium">Period</th>
                <th className="px-5 py-2 font-medium">Basic</th>
                <th className="px-5 py-2 font-medium">Allowances</th>
                <th className="px-5 py-2 font-medium">Deductions</th>
                <th className="px-5 py-2 font-medium">Net pay</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Slip</th>
              </tr>
            </thead>
            <tbody>
              {slips.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0">
                  {isHr && <td className="px-5 py-2.5 font-medium text-slate-800">{s.user.name}</td>}
                  <td className="px-5 py-2.5 text-slate-600">{s.monthLabel} {s.year}</td>
                  <td className="px-5 py-2.5 text-slate-600">{money(s.basic)}</td>
                  <td className="px-5 py-2.5 text-slate-600">{money(s.allowances)}</td>
                  <td className="px-5 py-2.5 text-slate-600">{money(s.deductions)}</td>
                  <td className="px-5 py-2.5 font-medium text-slate-900">{money(s.netPay)}</td>
                  <td className="px-5 py-2.5"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-2.5">
                    <a href={`/api/salary/${s.id}/pdf`} className="text-xs font-medium text-indigo-600 hover:underline">
                      Download PDF
                    </a>
                  </td>
                </tr>
              ))}
              {slips.length === 0 && (
                <tr>
                  <td colSpan={isHr ? 8 : 7} className="px-5 py-6 text-center text-slate-400 text-sm">No salary slips yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
