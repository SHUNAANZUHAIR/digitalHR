"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, X } from "lucide-react";

export default function ReviewButtons({ endpoint, id }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function review(status) {
    setLoading(true);
    await fetch(`${endpoint}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        disabled={loading}
        onClick={() => review("approved")}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
        title="Approve"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        disabled={loading}
        onClick={() => review("rejected")}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
        title="Reject"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
