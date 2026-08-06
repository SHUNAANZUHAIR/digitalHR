import { getSessionUser } from "@/lib/auth";
import {
  getTodayAttendance,
  listAllAttendance,
  listEmployees,
  listAllLeave,
  listAllServices,
  listAnnouncements,
  listLeaveForUser,
  listServicesForUser,
  listAppraisalsForUser,
  listCompanyLeaveCalendar,
} from "@/lib/db";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import ClockButton from "@/components/ClockButton";
import CompanyLeaveCalendar from "@/components/CompanyLeaveCalendar";
import Link from "next/link";
import { Users, Clock, CalendarDays, HandCoins } from "lucide-react";

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
        <Icon className="w-4.5 h-4.5 text-indigo-600" />
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

export default async function DashboardHome() {
  const user = await getSessionUser();
  const announcements = (await listAnnouncements()).slice(0, 3);
  const companyLeave = await listCompanyLeaveCalendar();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (user.role === "hr") {
    const employees = (await listEmployees()).filter((e) => e.role === "employee" && e.status !== "retired");
    const today = new Date().toISOString().slice(0, 10);
    const attToday = (await listAllAttendance()).filter((a) => a.date === today);
    const allLeave = await listAllLeave();
    const allServices = await listAllServices();
    const pendingLeave = allLeave.filter((l) => l.status === "pending");
    const pendingServices = allServices.filter((s) => s.status === "pending");

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{greeting}, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500 mt-1">Here's what's happening across the company today.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={Users} label="Employees" value={employees.length} />
          <Stat icon={Clock} label="Present today" value={`${attToday.filter((a) => a.status !== "absent").length}/${employees.length}`} />
          <Stat icon={CalendarDays} label="Pending leave requests" value={pendingLeave.length} />
          <Stat icon={HandCoins} label="Pending service requests" value={pendingServices.length} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Pending leave requests" action={<Link href="/dashboard/leave" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>}>
            {pendingLeave.length === 0 && <p className="text-sm text-slate-500">Nothing pending.</p>}
            <div className="space-y-3">
              {pendingLeave.slice(0, 4).map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{l.user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{l.type} · {l.days} day(s)</p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Pending service requests" action={<Link href="/dashboard/services" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>}>
            {pendingServices.length === 0 && <p className="text-sm text-slate-500">Nothing pending.</p>}
            <div className="space-y-3">
              {pendingServices.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{s.user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{s.type.replace("_", " ")}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card title="Recent announcements" action={<Link href="/dashboard/announcements" className="text-xs font-medium text-indigo-600 hover:underline">Manage</Link>}>
          <div className="divide-y divide-slate-100">
            {announcements.map((a) => (
              <div key={a.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-slate-800">{a.title}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.body}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Company leave calendar" subtitle="Who's planned leave, when they leave, and when they're back.">
          <CompanyLeaveCalendar entries={companyLeave} />
        </Card>
      </div>
    );
  }

  // Employee view
  const today = await getTodayAttendance(user.id);
  const leave = await listLeaveForUser(user.id);
  const services = await listServicesForUser(user.id);
  const appraisals = await listAppraisalsForUser(user.id);
  const pendingLeave = leave.filter((l) => l.status === "pending").length;
  const pendingServices = services.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{greeting}, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500 mt-1">{user.position} · {user.department}</p>
      </div>

      <Card title="Today's attendance">
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
            <div>
              <p className="text-xs text-slate-500">Break</p>
              <p className="font-medium text-slate-900">
                {today?.breakIn ? `${today.breakIn} – ${today.breakOut || "…"}` : "—"}
              </p>
            </div>
            {today && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <StatusBadge status={today.status} />
              </div>
            )}
          </div>
          <ClockButton
            checkedIn={!!today?.checkIn}
            checkedOut={!!today?.checkOut}
            breakStarted={!!today?.breakIn}
            breakEnded={!!today?.breakOut}
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat icon={CalendarDays} label="Pending leave requests" value={pendingLeave} />
        <Stat icon={HandCoins} label="Pending service requests" value={pendingServices} />
        <Stat icon={Clock} label="Appraisal cycles" value={appraisals.length} />
      </div>

      <Card title="Recent announcements" action={<Link href="/dashboard/announcements" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>}>
        <div className="divide-y divide-slate-100">
          {announcements.map((a) => (
            <div key={a.id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium text-slate-800">{a.title}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Company leave calendar" subtitle="Who's planned leave, when they leave, and when they're back.">
        <CompanyLeaveCalendar entries={companyLeave} />
      </Card>
    </div>
  );
}
