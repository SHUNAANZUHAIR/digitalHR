import { getSessionUser } from "@/lib/auth";
import { listAppraisalsForUser, listAllAppraisals, listEmployees } from "@/lib/db";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import NewAppraisalForm from "@/components/NewAppraisalForm";
import AppraisalSelfRating from "@/components/AppraisalSelfRating";
import AppraisalReviewForm from "@/components/AppraisalReviewForm";
import { TrendingUp } from "lucide-react";

export default async function AppraisalPage() {
  const user = await getSessionUser();
  const isHr = user.role === "hr";
  const appraisals = isHr ? await listAllAppraisals() : await listAppraisalsForUser(user.id);
  const employees = isHr ? (await listEmployees()).filter((e) => e.role === "employee" && e.status !== "retired") : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Appraisal</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isHr ? "Manage performance review cycles for the team." : "Track your performance review goals and ratings."}
          </p>
        </div>
        {isHr && <NewAppraisalForm employees={employees} />}
      </div>

      <div className="space-y-4">
        {appraisals.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {isHr ? a.user.name : "Review cycle"} · {a.cycle}
                    </h3>
                    {a.dueDate && <p className="text-xs text-slate-400 mt-0.5">Due {a.dueDate}</p>}
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                {a.goals && <p className="text-sm text-slate-600 mt-2">{a.goals}</p>}

                <div className="flex items-center gap-8 mt-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Self rating</p>
                    {!isHr ? (
                      <AppraisalSelfRating id={a.id} current={a.selfRating} />
                    ) : (
                      <p className="text-sm text-slate-700">{a.selfRating ? `${a.selfRating} / 5` : "Not submitted"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Manager rating</p>
                    <p className="text-sm text-slate-700">{a.managerRating ? `${a.managerRating} / 5` : "Pending"}</p>
                  </div>
                </div>

                {a.feedback && !isHr && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-1">Manager feedback</p>
                    <p className="text-sm text-slate-600">{a.feedback}</p>
                  </div>
                )}

                {isHr && a.status !== "completed" && (
                  <AppraisalReviewForm id={a.id} managerRating={a.managerRating} feedback={a.feedback} />
                )}
              </div>
            </div>
          </Card>
        ))}

        {appraisals.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-10">No appraisal cycles yet.</p>
        )}
      </div>
    </div>
  );
}
