"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";

type Category = { id: string; name: string; slug: string };

export default function CategoryManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setStatus("loading");
    setMessage("");

    const { data, error } = await supabase
      .from("categories")
      .insert({ name: trimmed, slug: slugify(trimmed) })
      .select()
      .single();

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setName("");
    setStatus("idle");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Products in it won't be deleted, just uncategorized.")) {
      return;
    }
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="flex gap-2 max-w-md">
        <input
          className="flex-1 border border-[var(--color-line)] rounded-sm px-3 py-2 bg-[var(--color-paper-light)] focus:outline-none focus:border-[var(--color-moss)]"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Resin Art"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-[var(--color-moss)] text-white rounded-sm px-4 py-2 text-sm hover:bg-[var(--color-moss-dark)] transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {message && <p className="text-sm text-[#A14A3F]">{message}</p>}

      <div className="divide-y divide-[var(--color-line)]">
        {categories.length === 0 && (
          <p className="text-[var(--color-ink-60)] text-sm">No categories yet.</p>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="flex justify-between items-center py-3">
            <span>{cat.name}</span>
            <button
              onClick={() => handleDelete(cat.id)}
              className="text-sm text-[#A14A3F]"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}