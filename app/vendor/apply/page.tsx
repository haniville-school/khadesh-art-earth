"use client";

import { useState } from "react";

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
    <div className="max-w-lg mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-6">Become a vendor</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Store name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Store URL slug</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-store"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bank</label>
          <select
            className="w-full border rounded px-3 py-2"
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
          <label className="block text-sm font-medium mb-1">Account number</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {status === "loading" ? "Submitting..." : "Submit application"}
        </button>

        {message && (
          <p className={status === "error" ? "text-red-600" : "text-green-600"}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}