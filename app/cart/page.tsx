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
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty.</p>
        <Link href="/" className="underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-6">Your cart</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-4 border-b pb-4">
            <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden relative shrink-0">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  No image
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-gray-600">
                ₦{item.price.toLocaleString()}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="border rounded w-7 h-7 flex items-center justify-center text-sm"
                >
                  −
                </button>
                <span className="text-sm w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="border rounded w-7 h-7 flex items-center justify-center text-sm disabled:opacity-40"
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-xs text-red-600 ml-4"
                >
                  Remove
                </button>
              </div>
            </div>

            <p className="font-medium whitespace-nowrap">
              ₦{(item.price * item.quantity).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-1 mb-6">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>₦{totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Transaction fee</span>
          <span>₦{transactionFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-lg font-medium">Total</span>
          <span className="text-lg font-semibold">
            ₦{grandTotal.toLocaleString()}
          </span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={checkingOut}
        className="w-full bg-black text-white rounded px-4 py-3 disabled:opacity-50"
      >
        {checkingOut ? "Redirecting..." : "Checkout"}
      </button>
    </div>
  );
}