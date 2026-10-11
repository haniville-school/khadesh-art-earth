import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ResetForm from "./reset-form";

export default async function ResetPasswordPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session means the reset link wasn't completed (expired, or opened elsewhere)
  if (!user) redirect("/forgot-password?expired=1");

  return <ResetForm />;
}