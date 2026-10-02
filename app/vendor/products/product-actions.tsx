"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    if (!confirm("Delete this product? This can't be undone.")) return;
    setLoading(true);
    await fetch(`/api/vendor/products/${product.id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={toggleStatus}
        disabled={loading}
        className="text-sm border rounded px-3 py-1.5 disabled:opacity-50"
      >
        {product.status === "published" ? "Unpublish" : "Publish"}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-sm border border-red-300 text-red-600 rounded px-3 py-1.5 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}