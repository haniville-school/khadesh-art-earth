import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveBankAccount } from "@/lib/paystack";
import { slugify } from "@/lib/slugify";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { storeName, slug, description, bankCode, accountNumber } = body;

  if (!storeName?.trim() || !bankCode || !accountNumber) {
    return NextResponse.json(
      { error: "Store name, bank and account number are required" },
      { status: 400 }
    );
  }

  const cleanSlug = slugify(slug || storeName);
  if (!cleanSlug) {
    return NextResponse.json(
      { error: "The store URL must contain at least one letter or number" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("vendors")
    .select("id")
    .eq("profile_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "You've already applied to sell. Check your account page for its status." },
      { status: 400 }
    );
  }

  let resolvedAccountName: string;
  try {
    const resolved = await resolveBankAccount(accountNumber, bankCode);
    resolvedAccountName = resolved.account_name;
  } catch (err) {
    return NextResponse.json(
      { error: "Could not verify bank account. Check the details and try again." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("vendors")
    .insert({
      profile_id: user.id,
      store_name: storeName.trim(),
      slug: cleanSlug,
      description,
      paystack_bank_code: bankCode,
      paystack_account_number: accountNumber,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That store URL is already taken. Try a different one." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    vendor: data,
    verifiedAccountName: resolvedAccountName,
  });
}