"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { slugify } from "@/lib/slugify";

export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("price", price);
    formData.set("stock", stock);
    if (images) {
      Array.from(images).forEach((file) => formData.append("images", file));
    }

    const res = await fetch("/api/vendor/products", {
      method: "POST",
      body: formData,
    });
    const json = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(json.error || "Something went wrong.");
      return;
    }

    router.push("/vendor/products");
    router.refresh();
  }

  const inputClass =
    "w-full border border-[var(--color-line)] rounded-sm px-3 py-2 bg-[var(--color-paper-light)] focus:outline-none focus:border-[var(--color-moss)]";

  return (
    <DashboardShell title="Add a piece" subtitle="Tell customers about what you made or grew">
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

        {title.trim() && (
          <p className="text-xs text-[var(--color-ink-50)] -mt-3">
            Will be listed at /products/{slugify(title) || "..."}
          </p>
        )}

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

        <div>
          <label className="block text-sm mb-1">Photos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(e.target.files)}
            className="w-full text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-[var(--color-moss)] text-white rounded-sm px-4 py-3 hover:bg-[var(--color-moss-dark)] transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Saving..." : "List this piece"}
        </button>

        {message && <p className="text-sm text-[#A14A3F]">{message}</p>}
      </form>
    </DashboardShell>
  );
}