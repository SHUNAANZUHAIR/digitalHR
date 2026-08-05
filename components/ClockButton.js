"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";

export default function ClockButton({ checkedIn, checkedOut }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(action) {
    setLoading(true);
    await fetch("/api/attendance/clock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    router.refresh();
  }

  if (checkedIn && checkedOut) {
    return <span className="text-xs text-slate-500">You've completed today's shift.</span>;
  }

  if (checkedIn) {
    return (
      <button
        onClick={() => act("out")}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
      >
        <LogOut className="w-4 h-4" />
        Clock out
      </button>
    );
  }

  return (
    <button
      onClick={() => act("in")}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
    >
      <LogIn className="w-4 h-4" />
      Clock in
    </button>
  );
}
