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
    <div className="max-w-md mx-auto py-20 px-4 text-center">
      {status === "loading" && <p>Confirming your payment...</p>}

      {status === "paid" && (
        <>
          <h1 className="text-2xl font-semibold mb-2">Payment successful 🎉</h1>
          <p className="text-gray-600 mb-6">
            Your order has been placed. You&apos;ll be contacted with shipping updates.
          </p>
          <Link href="/" className="underline">
            Continue shopping
          </Link>
        </>
      )}

      {status === "failed" && (
        <>
          <h1 className="text-2xl font-semibold mb-2">Payment not completed</h1>
          <p className="text-gray-600 mb-6">
            Your payment didn&apos;t go through. No charge was made.
          </p>
          <Link href="/cart" className="underline">
            Back to cart
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{message}</p>
        </>
      )}
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-20 px-4 text-center">Loading...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}