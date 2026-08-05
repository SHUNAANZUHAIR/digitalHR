"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

export default function AppraisalReviewForm({ id, managerRating, feedback }) {
  const router = useRouter();
  const [rating, setRating] = useState(managerRating || 0);
  const [note, setNote] = useState(feedback || "");
  const [loading, setLoading] = useState(false);

  async function save(status) {
    setLoading(true);
    await fetch(`/api/appraisals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ managerRating: rating, feedback: note, status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
      <div>
        <p className="text-xs font-medium text-slate-600 mb-1">Manager rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <button key={v} type="button" onClick={() => setRating(v)}>
              <Star className={`w-5 h-5 ${v <= rating ? "fill-indigo-500 text-indigo-500" : "text-slate-300"}`} />
            </button>
          ))}
        </div>
      </div>
      <textarea
        rows={2}
        placeholder="Feedback for the employee…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none"
      />
      <button
        disabled={loading}
        onClick={() => save("completed")}
        className="text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg px-3 py-1.5"
      >
        {loading ? "Saving…" : "Save & mark completed"}
      </button>
    </div>
  );
}
