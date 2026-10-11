"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CommissionEditor({
  vendorId,
  initialRate,
}: {
  vendorId: string;
  initialRate: number;
}) {
  const supabase = createClient();
  const [rate, setRate] = useState(String(initialRate));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave() {
    const parsed = parseFloat(rate);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      setStatus("error");
      return;
    }

    setStatus("saving");
    const { error } = await supabase
      .from("vendors")
      .update({ commission_rate: parsed })
      .eq("id", vendorId);

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <input
        type="number"
        step="0.1"
        min="0"
        max="100"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        className="w-16 border border-[var(--color-line)] rounded-sm px-2 py-1 text-sm bg-[var(--color-paper-light)] focus:outline-none focus:border-[var(--color-moss)]"
      />
      <span className="text-sm text-[var(--color-ink-50)]">%</span>
      <button
        onClick={handleSave}
        disabled={status === "saving"}
        className="text-xs border border-[var(--color-line)] rounded-sm px-2 py-1 hover:border-[var(--color-moss)] transition-colors disabled:opacity-50"
      >
        {status === "saving" ? "..." : status === "saved" ? "Saved" : status === "error" ? "Error" : "Save"}
      </button>
    </div>
  );
}