"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteReviewButton({
  reviewId,
  label = "Delete review",
}: {
  reviewId: string;
  label?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this review?")) return;
    setBusy(true);
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    setBusy(false);
    if (!error) router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="text-xs text-[#A14A3F] underline underline-offset-4 disabled:opacity-50"
    >
      {busy ? "Deleting..." : label}
    </button>
  );
}