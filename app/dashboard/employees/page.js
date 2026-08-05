import { getSessionUser } from "@/lib/auth";
import { listEmployees } from "@/lib/db";
import Card from "@/components/Card";
import OnboardEmployeeForm from "@/components/OnboardEmployeeForm";
import EmployeeGrid from "@/components/EmployeeGrid";
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
        <EmployeeGrid employees={employees} isHr={user.role === "hr"} currentUserId={user.id} />
      </Card>
    </div>
  );
}
