"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GoogleButton from "@/app/components/google-button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const authFailed = searchParams.get("error") === "auth_failed";

  const rawNext = searchParams.get("next") || "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const inputClass =
    "w-full border border-[var(--color-line)] rounded-sm px-3 py-2 bg-[var(--color-paper-light)] focus:outline-none focus:border-[var(--color-moss)]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto py-16 px-6">
      <h1 className="font-display text-3xl mb-6">Log in</h1>

      {authFailed && (
        <p className="text-sm text-[#A14A3F] mb-4">
          Sign-in didn&apos;t complete. Please try again.
        </p>
      )}

      <GoogleButton next={next} />

      <div className="flex items-center gap-3 my-5 text-xs text-[var(--color-ink-50)]">
        <span className="flex-1 border-t border-[var(--color-line)]" />
        or log in with email
        <span className="flex-1 border-t border-[var(--color-line)]" />
      </div>

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

        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="block text-sm">Password</label>
            <a
              href="/forgot-password"
              className="text-xs text-[var(--color-plum)] underline underline-offset-4"
            >
              Forgot password?
            </a>
          </div>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-[var(--color-moss)] text-white rounded-sm px-4 py-2 hover:bg-[var(--color-moss-dark)] transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Logging in..." : "Log in"}
        </button>

        {message && <p className="text-sm text-[#A14A3F]">{message}</p>}
      </form>

      <p className="text-sm mt-4 text-[var(--color-ink-70)]">
        No account yet?{" "}
        <a href="/signup" className="text-[var(--color-plum)] underline underline-offset-4">
          Sign up
        </a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-sm mx-auto py-16 px-6">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}