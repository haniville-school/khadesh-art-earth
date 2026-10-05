"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProfileData = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
};

export default function ProfileForm({ initial }: { initial: ProfileData }) {
  const supabase = createClient();
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const inputClass =
    "w-full border border-[var(--color-line)] rounded-sm px-3 py-2 bg-[var(--color-paper-light)] focus:outline-none focus:border-[var(--color-moss)]";

  function update<K extends keyof ProfileData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.fullName,
        phone: form.phone,
        address_line1: form.addressLine1,
        address_line2: form.addressLine2,
        city: form.city,
        state: form.state,
      })
      .eq("id", user.id);

    setStatus(error ? "error" : "saved");
    if (!error) setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Full name</label>
        <input
          className={inputClass}
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Phone number</label>
        <input
          className={inputClass}
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Address</label>
        <input
          className={inputClass}
          value={form.addressLine1}
          onChange={(e) => update("addressLine1", e.target.value)}
          placeholder="Street address"
        />
      </div>

      <input
        className={inputClass}
        value={form.addressLine2}
        onChange={(e) => update("addressLine2", e.target.value)}
        placeholder="Apartment, suite, etc. (optional)"
      />

      <div className="flex gap-3">
        <input
          className={inputClass}
          value={form.city}
          onChange={(e) => update("city", e.target.value)}
          placeholder="City"
        />
        <input
          className={inputClass}
          value={form.state}
          onChange={(e) => update("state", e.target.value)}
          placeholder="State"
        />
      </div>

      <button
        type="submit"
        disabled={status === "saving"}
        className="border border-[var(--color-line)] rounded-sm px-4 py-2 text-sm hover:border-[var(--color-moss)] transition-colors disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Save changes"}
      </button>
      {status === "error" && (
        <p className="text-sm text-[#A14A3F]">Couldn&apos;t save - try again.</p>
      )}
    </form>
  );
}