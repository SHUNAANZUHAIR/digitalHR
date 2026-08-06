"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote } from "lucide-react";

export default function MarkPaidButton({ id }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markPaid() {
    setLoading(true);
    await fetch(`/api/salary/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      disabled={loading}
      onClick={markPaid}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 text-xs font-medium"
    >
      <Banknote className="w-3.5 h-3.5" />
      {loading ? "Paying…" : "Mark as paid"}
    </button>
  );
}
