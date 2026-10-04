"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Product = {
  id: string;
  status: string;
};

export default function ProductActions({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    const newStatus = product.status === "published" ? "draft" : "published";
    await fetch(`/api/vendor/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this piece? This can't be undone.")) return;
    setLoading(true);
    await fetch(`/api/vendor/products/${product.id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Link
        href={`/vendor/products/${product.id}/edit`}
        className="text-sm border border-[var(--color-line)] rounded-sm px-3 py-1.5 hover:border-[var(--color-moss)] transition-colors"
      >
        Edit
      </Link>
      <button
        onClick={toggleStatus}
        disabled={loading}
        className="text-sm border border-[var(--color-line)] rounded-sm px-3 py-1.5 hover:border-[var(--color-plum)] hover:text-[var(--color-plum)] transition-colors disabled:opacity-50"
      >
        {product.status === "published" ? "Unpublish" : "Publish"}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-sm border border-[var(--color-line)] text-[#A14A3F] rounded-sm px-3 py-1.5 hover:border-[#A14A3F] transition-colors disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}