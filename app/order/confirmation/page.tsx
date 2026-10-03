"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const { clearCart } = useCart();

  const [status, setStatus] = useState<"loading" | "paid" | "failed" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No order reference found.");
      return;
    }

    fetch("/api/orders/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "paid") {
          clearCart();
          setStatus("paid");
        } else if (json.status === "failed") {
          setStatus("failed");
        } else {
          setStatus("error");
          setMessage(json.error || "Something went wrong verifying your order.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not reach the server to verify your order.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  return (
    <div className="max-w-md mx-auto py-24 px-6 text-center">
      {status === "loading" && (
        <p className="text-[var(--color-ink-60)]">Confirming your payment...</p>
      )}

      {status === "paid" && (
        <>
          <h1 className="font-display text-3xl mb-3">Payment successful</h1>
          <p className="text-[var(--color-ink-70)] mb-6 leading-relaxed">
            Your order has been placed. You&apos;ll be contacted with shipping updates.
          </p>
          <Link href="/" className="text-[var(--color-plum)] underline underline-offset-4">
            Continue shopping
          </Link>
        </>
      )}

      {status === "failed" && (
        <>
          <h1 className="font-display text-3xl mb-3">Payment not completed</h1>
          <p className="text-[var(--color-ink-70)] mb-6 leading-relaxed">
            Your payment didn&apos;t go through. No charge was made.
          </p>
          <Link href="/cart" className="text-[var(--color-plum)] underline underline-offset-4">
            Back to cart
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="font-display text-3xl mb-3">Something went wrong</h1>
          <p className="text-[var(--color-ink-70)] mb-6">{message}</p>
        </>
      )}
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-24 px-6 text-center text-[var(--color-ink-60)]">
          Loading...
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}