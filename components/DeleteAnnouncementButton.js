"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteAnnouncementButton({ id }) {
  const router = useRouter();
  async function onDelete() {
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <button onClick={onDelete} className="text-slate-400 hover:text-rose-600 transition">
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
