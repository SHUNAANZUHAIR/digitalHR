import { getSessionUser } from "@/lib/auth";
import { listEmployees } from "@/lib/db";
import Card from "@/components/Card";
import OnboardEmployeeForm from "@/components/OnboardEmployeeForm";
import EmployeeGrid from "@/components/EmployeeGrid";
import { redirect } from "next/navigation";

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

export default async function EmployeesPage() {
  const user = await getSessionUser();
  if (user.role !== "hr") redirect("/dashboard");

  const employees = (await listEmployees()).filter((e) => e.role === "employee");
  const retiredCount = employees.filter((e) => e.status === "retired").length;
  const activeCount = employees.length - retiredCount;
  const departmentCount = new Set(employees.filter((e) => e.department).map((e) => e.department)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">Onboard and manage employee accounts.</p>
        </div>
        <OnboardEmployeeForm />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-start">
        <Card title="All employees">
          <EmployeeGrid employees={employees} isHr={user.role === "hr"} currentUserId={user.id} />
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <Stat label="Total employees" value={employees.length} />
          <Stat label="Active" value={activeCount} />
          <Stat label="Retired" value={retiredCount} />
          <Stat label="Departments" value={departmentCount} />
        </div>
      </div>
    </div>
  );
}
