"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  stock: number;
};

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const inputClass =
    "w-full border border-[var(--color-line)] rounded-sm px-3 py-2 bg-[var(--color-paper-light)] focus:outline-none focus:border-[var(--color-moss)]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const res = await fetch(`/api/vendor/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      setStatus("error");
      setMessage(json.error || "Something went wrong.");
      return;
    }

    router.push("/vendor/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm mb-1">Title</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Description</label>
        <textarea
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm mb-1">Price (₦)</label>
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm mb-1">Stock</label>
          <input
            type="number"
            className={inputClass}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-[var(--color-moss)] text-white rounded-sm px-4 py-3 hover:bg-[var(--color-moss-dark)] transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Saving..." : "Save changes"}
      </button>

      {message && <p className="text-sm text-[#A14A3F]">{message}</p>}
    </form>
  );
}