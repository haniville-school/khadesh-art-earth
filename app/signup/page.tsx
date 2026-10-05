"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const inputClass =
    "w-full border border-[var(--color-line)] rounded-sm px-3 py-2 bg-[var(--color-paper-light)] focus:outline-none focus:border-[var(--color-moss)]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          state,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    if (!data.session) {
      setMessage("Check your email to confirm your account before signing in.");
      setStatus("idle");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto py-16 px-6">
      <h1 className="font-display text-3xl mb-1">Create an account</h1>
      <p className="text-sm text-[var(--color-ink-60)] mb-6">
        Your shipping details save here so checkout is quick next time.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Full name</label>
          <input
            className={inputClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

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
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Phone number</label>
          <input
            type="tel"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Address</label>
          <input
            className={inputClass}
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            placeholder="Street address"
            required
          />
        </div>

        <div>
          <input
            className={inputClass}
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            placeholder="Apartment, suite, etc. (optional)"
          />
        </div>

        <div className="flex gap-3">
          <input
            className={inputClass}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            required
          />
          <input
            className={inputClass}
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
            required
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-[var(--color-moss)] text-white rounded-sm px-4 py-2 hover:bg-[var(--color-moss-dark)] transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Creating account..." : "Sign up"}
        </button>

        {message && <p className="text-sm text-[var(--color-ink-70)]">{message}</p>}
      </form>

      <p className="text-sm mt-4 text-[var(--color-ink-70)]">
        Already have an account?{" "}
        <a href="/login" className="text-[var(--color-plum)] underline underline-offset-4">
          Log in
        </a>
      </p>
    </div>
  );
}