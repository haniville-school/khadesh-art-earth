"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveButton({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/vendors/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Failed to approve");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="text-right shrink-0">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="bg-[var(--color-moss)] text-white rounded-sm px-3 py-1.5 text-sm hover:bg-[var(--color-moss-dark)] transition-colors disabled:opacity-50"
      >
        {loading ? "Approving..." : "Approve"}
      </button>
      {error && <p className="text-xs text-[#A14A3F] mt-1">{error}</p>}
    </div>
  );
}