"use client";

import { useCart } from "@/lib/cart/cart-context";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { calculateTransactionFee } from "@/lib/fees";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const transactionFee = calculateTransactionFee(totalPrice);
  const grandTotal = totalPrice + transactionFee;

  async function handleCheckout() {
    setCheckingOut(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "Checkout failed. Please try again.");
      setCheckingOut(false);
      return;
    }

    window.location.href = json.authorizationUrl;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center">
        <p className="text-[var(--color-ink-60)] mb-4">Your cart is empty.</p>
        <Link href="/" className="text-[var(--color-plum)] underline underline-offset-4">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl mb-6">Your cart</h1>

      <div className="divide-y divide-[var(--color-line)] mb-8">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-4 py-4">
            <div className="w-20 h-20 rounded-sm overflow-hidden relative shrink-0 bg-[var(--color-line)]">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : null}
            </div>

            <div className="flex-1">
              <p>{item.title}</p>
              <p className="text-sm text-[var(--color-ink-60)]">
                ₦{item.price.toLocaleString()}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="border border-[var(--color-line)] rounded-sm w-7 h-7 flex items-center justify-center text-sm"
                >
                  −
                </button>
                <span className="text-sm w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="border border-[var(--color-line)] rounded-sm w-7 h-7 flex items-center justify-center text-sm disabled:opacity-40"
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-xs text-[#A14A3F] ml-4"
                >
                  Remove
                </button>
              </div>
            </div>

            <p className="whitespace-nowrap text-[var(--color-ochre)] font-medium">
              ₦{(item.price * item.quantity).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-1 mb-6">
        <div className="flex justify-between text-sm text-[var(--color-ink-60)]">
          <span>Subtotal</span>
          <span>₦{totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-[var(--color-ink-60)]">
          <span>Transaction fee</span>
          <span>₦{transactionFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-[var(--color-line)]">
          <span className="font-display text-xl">Total</span>
          <span className="font-display text-xl text-[var(--color-ochre)]">
            ₦{grandTotal.toLocaleString()}
          </span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={checkingOut}
        className="w-full bg-[var(--color-moss)] text-white rounded-sm px-4 py-3 hover:bg-[var(--color-moss-dark)] transition-colors disabled:opacity-50"
      >
        {checkingOut ? "Redirecting..." : "Checkout"}
      </button>
    </div>
  );
}