"use client";

import { useState } from "react";
import { DashboardShell } from "@/app/components/dashboard-shell";

type Bank = { id: number; name: string; code: string };

export default function VendorApplyPage() {
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const inputClass =
    "w-full border border-[var(--color-line)] rounded-sm px-3 py-2 bg-[var(--color-paper-light)] focus:outline-none focus:border-[var(--color-moss)]";

  async function loadBanks() {
    if (banks.length > 0) return;
    const res = await fetch("/api/paystack/banks");
    const json = await res.json();
    setBanks(json.banks || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const res = await fetch("/api/vendors/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeName, slug, description, bankCode, accountNumber }),
    });
    const json = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(json.error || "Something went wrong.");
      return;
    }

    setStatus("success");
    setMessage(
      `Application submitted. Verified account name: ${json.verifiedAccountName}. We'll review and approve your store shortly.`
    );
  }

  return (
    <DashboardShell title="Become a vendor" subtitle="Sell your pottery, art, or flowers on Khadesh Art">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm mb-1">Store name</label>
          <input
            className={inputClass}
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Store URL slug</label>
          <input
            className={inputClass}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-store"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Bank</label>
          <select
            className={inputClass}
            value={bankCode}
            onFocus={loadBanks}
            onChange={(e) => setBankCode(e.target.value)}
            required
          >
            <option value="">Select your bank</option>
            <option value="001">Test Bank (dev only)</option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Account number</label>
          <input
            className={inputClass}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-[var(--color-moss)] text-white rounded-sm px-4 py-2 hover:bg-[var(--color-moss-dark)] transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Submitting..." : "Submit application"}
        </button>

        {message && (
          <p className={status === "error" ? "text-sm text-[#A14A3F]" : "text-sm text-[var(--color-moss)]"}>
            {message}
          </p>
        )}
      </form>
    </DashboardShell>
  );
}