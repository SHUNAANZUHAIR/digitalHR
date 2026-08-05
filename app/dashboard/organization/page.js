import { getSessionUser } from "@/lib/auth";
import { listOrgStructure } from "@/lib/db";
import Card from "@/components/Card";
import OrgStructureManager from "@/components/OrgStructureManager";
import { redirect } from "next/navigation";

export default async function OrganizationPage() {
  const user = await getSessionUser();
  if (user.role !== "hr") redirect("/dashboard");

  const departments = await listOrgStructure();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Organization structure</h1>
        <p className="text-sm text-slate-500 mt-1">Manage departments, sections and units.</p>
      </div>

      <Card title="Departments">
        <OrgStructureManager departments={departments} />
      </Card>
    </div>
  );
}
