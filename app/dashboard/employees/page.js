import { getSessionUser } from "@/lib/auth";
import { listEmployees } from "@/lib/db";
import Card from "@/components/Card";
import OnboardEmployeeForm from "@/components/OnboardEmployeeForm";
import { redirect } from "next/navigation";

export default async function EmployeesPage() {
  const user = await getSessionUser();
  if (user.role !== "hr") redirect("/dashboard");

  const employees = (await listEmployees()).filter((e) => e.role === "employee");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">Onboard and manage employee accounts.</p>
        </div>
        <OnboardEmployeeForm />
      </div>

      <Card title="All employees">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Email</th>
                <th className="px-5 py-2 font-medium">Department</th>
                <th className="px-5 py-2 font-medium">Position</th>
                <th className="px-5 py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-2.5 font-medium text-slate-800">{e.name}</td>
                  <td className="px-5 py-2.5 text-slate-600">{e.email}</td>
                  <td className="px-5 py-2.5 text-slate-600">{e.department || "—"}</td>
                  <td className="px-5 py-2.5 text-slate-600">{e.position || "—"}</td>
                  <td className="px-5 py-2.5 text-slate-600">{e.join_date || "—"}</td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-400 text-sm">No employees yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
