"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotForm({ expired }: { expired: boolean }) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const inputClass =
    "w-full border border-[var(--color-line)] rounded-sm px-3 py-2 bg-[var(--color-paper-light)] focus:outline-none focus:border-[var(--color-moss)]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="max-w-sm mx-auto py-16 px-6">
      <h1 className="font-display text-3xl mb-1">Reset your password</h1>
      <p className="text-sm text-[var(--color-ink-60)] mb-6">
        Enter your email and we&apos;ll send you a link to choose a new one.
      </p>

      {expired && status !== "sent" && (
        <p className="text-sm text-[#A14A3F] mb-4">
          That reset link expired, or was opened on a different device. Request a new one below.
        </p>
      )}

      {status === "sent" ? (
        <p className="text-sm text-[var(--color-ink-70)] leading-relaxed">
          If an account exists for {email}, a reset link is on its way. Open it on this same
          device and browser.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-[var(--color-moss)] text-white rounded-sm px-4 py-2 hover:bg-[var(--color-moss-dark)] transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Sending..." : "Send reset link"}
          </button>

          {message && <p className="text-sm text-[#A14A3F]">{message}</p>}
        </form>
      )}

      <p className="text-sm mt-4 text-[var(--color-ink-70)]">
        <a href="/login" className="text-[var(--color-plum)] underline underline-offset-4">
          Back to log in
        </a>
      </p>
    </div>
  );
}