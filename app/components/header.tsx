"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="border-b border-[var(--color-line)] bg-[var(--color-paper-light)]">
      <div className="max-w-5xl mx-auto px-6 py-5 flex justify-between items-center">
        <Link
          href="/"
          className="font-display italic text-2xl tracking-tight text-[var(--color-ink)]"
        >
          Khadesh Art
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/vendor/apply"
            className="text-[var(--color-plum)] hover:underline underline-offset-4"
          >
            Sell with us
          </Link>
          <Link href="/cart" className="relative text-[var(--color-ink)]">
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-4 bg-[var(--color-ochre)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}