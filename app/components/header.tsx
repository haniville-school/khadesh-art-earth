"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="border-b">
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="font-semibold text-lg">
          Your Store
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/vendor/apply">Sell on our store</Link>
          <Link href="/cart" className="relative">
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}