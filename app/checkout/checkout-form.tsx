"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { calculateTransactionFee } from "@/lib/fees";
import { createClient } from "@/lib/supabase/client";

type AddressData = {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
};

export default function CheckoutForm({ initial }: { initial: AddressData }) {
  const { items, totalPrice } = useCart();
  const supabase = createClient();

  const [form, setForm] = useState(initial);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const transactionFee = calculateTransactionFee(totalPrice);
  const grandTotal = totalPrice + transactionFee;

  const inputClass =
    "w-full border border-[var(--color-line)] rounded-sm px-3 py-2 bg-[var(--color-paper-light)] focus:outline-none focus:border-[var(--color-moss)]";

  function update<K extends keyof AddressData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    if (saveToProfile) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({
            phone: form.phone,
            address_line1: form.addressLine1,
            address_line2: form.addressLine2,
            city: form.city,
            state: form.state,
          })
          .eq("id", user.id);
      }
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: form,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(json.error || "Checkout failed. Please try again.");
      return;
    }

    window.location.href = json.authorizationUrl;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-6 text-center">
        <p className="text-[var(--color-ink-60)] mb-4">Your cart is empty.</p>
        <Link href="/" className="text-[var(--color-plum)] underline underline-offset-4">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <h1 className="font-display text-3xl mb-6">Shipping details</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Phone number</label>
          <input
            type="tel"
            className={inputClass}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Address</label>
          <input
            className={inputClass}
            value={form.addressLine1}
            onChange={(e) => update("addressLine1", e.target.value)}
            placeholder="Street address"
            required
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
            required
          />
          <input
            className={inputClass}
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            placeholder="State"
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-ink-70)]">
          <input
            type="checkbox"
            checked={saveToProfile}
            onChange={(e) => setSaveToProfile(e.target.checked)}
          />
          Save as my default shipping address
        </label>

        <div className="space-y-1 pt-4 border-t border-[var(--color-line)]">
          <div className="flex justify-between text-sm text-[var(--color-ink-60)]">
            <span>Subtotal</span>
            <span>₦{totalPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-[var(--color-ink-60)]">
            <span>Transaction fee</span>
            <span>₦{transactionFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="font-display text-xl">Total</span>
            <span className="font-display text-xl text-[var(--color-ochre)]">
              ₦{grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-[var(--color-moss)] text-white rounded-sm px-4 py-3 hover:bg-[var(--color-moss-dark)] transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Redirecting..." : "Pay now"}
        </button>

        {message && <p className="text-sm text-[#A14A3F]">{message}</p>}
      </form>
    </div>
  );
}