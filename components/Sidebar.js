"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  Wallet,
  Megaphone,
  CalendarDays,
  CalendarRange,
  HandCoins,
  TrendingUp,
  LogOut,
  Building2,
  Users,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/attendance", label: "Attendance", icon: Clock },
  { href: "/dashboard/salary", label: "Salary", icon: Wallet },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/leave", label: "Leave", icon: CalendarDays },
  { href: "/dashboard/services", label: "Requests", icon: HandCoins },
  { href: "/dashboard/appraisal", label: "Appraisal", icon: TrendingUp },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarRange },
];

const HR_NAV = [
  { href: "/dashboard/employees", label: "Employees", icon: Users },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Building2 className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-sm">Northstar HR</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {(user.role === "hr" ? [...NAV.slice(0, 1), ...HR_NAV, ...NAV.slice(1)] : NAV).map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
            {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role === "hr" ? "HR Admin" : user.position}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
