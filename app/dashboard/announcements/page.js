import { getSessionUser } from "@/lib/auth";
import { listAnnouncements } from "@/lib/db";
import Card from "@/components/Card";
import AnnouncementForm from "@/components/AnnouncementForm";
import DeleteAnnouncementButton from "@/components/DeleteAnnouncementButton";
import { Megaphone } from "lucide-react";

const PRIORITY_STYLE = {
  urgent: "bg-rose-50 text-rose-700",
  important: "bg-amber-50 text-amber-700",
  normal: "bg-slate-100 text-slate-600",
};

export default async function AnnouncementsPage() {
  const user = await getSessionUser();
  const isHr = user.role === "hr";
  const announcements = await listAnnouncements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500 mt-1">Updates and notices from HR.</p>
        </div>
        {isHr && <AnnouncementForm />}
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Megaphone className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLE[a.priority]}`}>{a.priority}</span>
                    {isHr && <DeleteAnnouncementButton id={a.id} />}
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-1.5">{a.body}</p>
                <p className="text-xs text-slate-400 mt-2">{a.postedBy} · {a.postedAt}</p>
              </div>
            </div>
          </Card>
        ))}
        {announcements.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-10">No announcements yet.</p>
        )}
      </div>
    </div>
  );
}
