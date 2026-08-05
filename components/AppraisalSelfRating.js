"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

export default function AppraisalSelfRating({ id, current }) {
  const router = useRouter();
  const [rating, setRating] = useState(current || 0);
  const [loading, setLoading] = useState(false);

  async function submit(value) {
    setRating(value);
    setLoading(true);
    await fetch("/api/appraisals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, selfRating: value }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((v) => (
        <button key={v} disabled={loading} onClick={() => submit(v)} type="button">
          <Star className={`w-5 h-5 ${v <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
        </button>
      ))}
    </div>
  );
}
