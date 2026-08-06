"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn, LogOut, Coffee, CircleCheck } from "lucide-react";

export default function ClockButton({ checkedIn, checkedOut, breakStarted, breakEnded }) {
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
    const onBreak = breakStarted && !breakEnded;
    return (
      <div className="flex items-center gap-2">
        {onBreak ? (
          <button
            onClick={() => act("break_out")}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
          >
            <CircleCheck className="w-4 h-4" />
            End break
          </button>
        ) : (
          <>
            {!breakStarted && (
              <button
                onClick={() => act("break_in")}
                disabled={loading}
                className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-sm font-medium rounded-lg px-4 py-2 transition"
              >
                <Coffee className="w-4 h-4" />
                Start break
              </button>
            )}
            <button
              onClick={() => act("out")}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
            >
              <LogOut className="w-4 h-4" />
              Clock out
            </button>
          </>
        )}
      </div>
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
