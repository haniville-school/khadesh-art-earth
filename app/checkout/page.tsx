import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CheckoutForm from "./checkout-form";

export default async function CheckoutPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/checkout");

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone, address_line1, address_line2, city, state")
    .eq("id", user.id)
    .single();

  return (
    <CheckoutForm
      initial={{
        phone: profile?.phone ?? "",
        addressLine1: profile?.address_line1 ?? "",
        addressLine2: profile?.address_line2 ?? "",
        city: profile?.city ?? "",
        state: profile?.state ?? "",
      }}
    />
  );
}