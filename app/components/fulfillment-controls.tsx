"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "vendor" | "customer" | "admin";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function FulfillmentControls({
  itemId,
  current,
  role,
  note,
}: {
  itemId: string;
  current: string;
  role: Role;
  note?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [trackingNote, setTrackingNote] = useState(note ?? "");
  const [adminStatus, setAdminStatus] = useState(current);

  const buttonClass =
    "text-sm border border-[var(--color-line)] rounded-sm px-3 py-1.5 hover:border-[var(--color-moss)] transition-colors disabled:opacity-50";

  async function update(status: string) {
    setBusy(true);
    setError("");

    const res = await fetch(`/api/order-items/${itemId}/fulfillment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        note: role === "customer" ? undefined : trackingNote,
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Couldn't update");
      setBusy(false);
      return;
    }

    setBusy(false);
    router.refresh();
  }

  if (role === "customer") {
    if (current !== "shipped") return null;
    return (
      <div className="mt-2">
        <button
          disabled={busy}
          onClick={() => {
            if (confirm("Confirm you've received this item?")) update("delivered");
          }}
          className={buttonClass}
        >
          I&apos;ve received this
        </button>
        {error && <p className="text-xs text-[#A14A3F] mt-1">{error}</p>}
      </div>
    );
  }

  if (role === "vendor") {
    if (current === "delivered" || current === "cancelled") return null;
    return (
      <div className="mt-2 space-y-2">
        <input
          value={trackingNote}
          onChange={(e) => setTrackingNote(e.target.value)}
          placeholder="Courier / tracking note (optional)"
          className="w-full border border-[var(--color-line)] rounded-sm px-3 py-1.5 text-sm bg-[var(--color-paper-light)] focus:outline-none focus:border-[var(--color-moss)]"
        />
        <div className="flex gap-2 flex-wrap">
          {current === "pending" && (
            <button disabled={busy} onClick={() => update("processing")} className={buttonClass}>
              Mark processing
            </button>
          )}
          <button disabled={busy} onClick={() => update("shipped")} className={buttonClass}>
            {current === "shipped" ? "Update note" : "Mark shipped"}
          </button>
        </div>
        {error && <p className="text-xs text-[#A14A3F]">{error}</p>}
      </div>
    );
  }

  // admin override
  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <select
        value={adminStatus}
        onChange={(e) => setAdminStatus(e.target.value)}
        className="border border-[var(--color-line)] rounded-sm px-2 py-1 text-sm bg-[var(--color-paper-light)]"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        disabled={busy || adminStatus === current}
        onClick={() => update(adminStatus)}
        className={buttonClass}
      >
        Save
      </button>
      {error && <p className="text-xs text-[#A14A3F]">{error}</p>}
    </div>
  );
}