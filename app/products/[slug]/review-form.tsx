"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DeleteReviewButton from "./delete-review-button";

type Existing = { id: string; rating: number; body: string | null };

export default function ReviewForm({
  productId,
  existing,
}: {
  productId: string;
  existing: Existing | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating < 1) {
      setStatus("error");
      setMessage("Choose a star rating first.");
      return;
    }

    setStatus("saving");
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("error");
      setMessage("Please log in again.");
      return;
    }

    const trimmed = body.trim() || null;

    const result = existing
      ? await supabase.from("reviews").update({ rating, body: trimmed }).eq("id", existing.id)
      : await supabase
          .from("reviews")
          .insert({ product_id: productId, customer_id: user.id, rating, body: trimmed });

    if (result.error) {
      setStatus("error");
      setMessage("Couldn't save your review. You can review a piece once it has shipped to you.");
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className={`text-3xl leading-none ${
              n <= rating ? "text-[var(--color-ochre)]" : "text-[var(--color-line)]"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Tell others about it (optional)"
        className="w-full border border-[var(--color-line)] rounded-sm px-3 py-2 bg-[var(--color-paper-light)] focus:outline-none focus:border-[var(--color-moss)]"
      />

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "saving"}
          className="bg-[var(--color-moss)] text-white rounded-sm px-4 py-2 text-sm hover:bg-[var(--color-moss-dark)] transition-colors disabled:opacity-50"
        >
          {status === "saving" ? "Saving..." : existing ? "Update review" : "Post review"}
        </button>
        {existing && <DeleteReviewButton reviewId={existing.id} label="Delete my review" />}
      </div>

      {message && <p className="text-sm text-[#A14A3F]">{message}</p>}
    </form>
  );
}