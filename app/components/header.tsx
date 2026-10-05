"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const { totalItems } = useCart();
  const router = useRouter();
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <header className="border-b border-[var(--color-line)] bg-[var(--color-paper-light)]">
      <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="font-display italic text-2xl tracking-tight text-[var(--color-ink)] shrink-0"
        >
          Khadesh Art
        </Link>

        <form onSubmit={handleSearch} className="flex-1 min-w-[160px] order-3 sm:order-none">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for pottery, art, flowers..."
            className="w-full border border-[var(--color-line)] rounded-sm px-3 py-1.5 text-sm bg-[var(--color-paper)] focus:outline-none focus:border-[var(--color-moss)]"
          />
        </form>

        <nav className="flex items-center gap-6 text-sm shrink-0 ml-auto">
          <Link
            href="/vendor/apply"
            className="text-[var(--color-plum)] hover:underline underline-offset-4"
          >
            Sell with us
          </Link>

          {email === undefined ? null : email ? (
            <Link href="/account" className="text-[var(--color-ink)]">
              Account
            </Link>
          ) : (
            <Link href="/login" className="text-[var(--color-ink)]">
              Log in
            </Link>
          )}

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