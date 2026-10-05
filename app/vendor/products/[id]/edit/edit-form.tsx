"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Product = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[] | null;
};

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [images, setImages] = useState<string[]>(product.images ?? []);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [imageBusy, setImageBusy] = useState(false);

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

  async function handleAddPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setImageBusy(true);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("images", file));

    const res = await fetch(`/api/vendor/products/${product.id}/images`, {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    if (res.ok) setImages(json.images);
    setImageBusy(false);
  }

  async function handleRemovePhoto(url: string) {
    setImageBusy(true);
    const res = await fetch(`/api/vendor/products/${product.id}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });
    const json = await res.json();
    if (res.ok) setImages(json.images);
    setImageBusy(false);
  }

  async function handleSetCover(url: string) {
    setImageBusy(true);
    const reordered = [url, ...images.filter((img) => img !== url)];
    const res = await fetch(`/api/vendor/products/${product.id}/images`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: reordered }),
    });
    const json = await res.json();
    if (res.ok) setImages(json.images);
    setImageBusy(false);
  }

  return (
    <div className="max-w-lg space-y-10">
      <div>
        <h2 className="text-sm text-[var(--color-ink-60)] mb-3">Photos</h2>

        {images.length > 0 && (
          <div className="flex gap-3 flex-wrap mb-4">
            {images.map((url, i) => (
              <div key={url} className="relative w-20 h-20">
                <div
                  className={`w-20 h-20 rounded-sm overflow-hidden relative border-2 ${
                    i === 0 ? "border-[var(--color-moss)]" : "border-transparent"
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" />
                </div>
                <button
                  onClick={() => handleRemovePhoto(url)}
                  disabled={imageBusy}
                  className="absolute -top-2 -right-2 bg-[#A14A3F] text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  title="Remove photo"
                >
                  ×
                </button>
                {i !== 0 && (
                  <button
                    onClick={() => handleSetCover(url)}
                    disabled={imageBusy}
                    className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-0.5 text-center"
                  >
                    Set as cover
                  </button>
                )}
                {i === 0 && (
                  <span className="absolute bottom-0 inset-x-0 bg-[var(--color-moss)] text-white text-[10px] py-0.5 text-center">
                    Cover photo
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          multiple
          disabled={imageBusy}
          onChange={(e) => handleAddPhotos(e.target.files)}
          className="text-sm"
        />
        {imageBusy && <p className="text-xs text-[var(--color-ink-50)] mt-1">Updating photos...</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
    </div>
  );
}