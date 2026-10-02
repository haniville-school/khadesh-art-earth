"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
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
    formData.set("slug", slug);
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

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-6">Add a product</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">URL slug</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="blue-ceramic-mug"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Price (₦)</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded px-3 py-2"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(e.target.files)}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {status === "loading" ? "Saving..." : "Create product"}
        </button>

        {message && <p className="text-sm text-red-600">{message}</p>}
      </form>
    </div>
  );
}