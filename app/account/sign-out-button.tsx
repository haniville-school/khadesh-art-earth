"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm border border-[var(--color-line)] rounded-sm px-4 py-2 hover:border-[#A14A3F] hover:text-[#A14A3F] transition-colors"
    >
      Sign out
    </button>
  );
}