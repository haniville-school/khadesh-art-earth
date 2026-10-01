import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveBankAccount } from "@/lib/paystack";

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

  if (!storeName || !slug || !bankCode || !accountNumber) {
    return NextResponse.json(
      { error: "storeName, slug, bankCode and accountNumber are required" },
      { status: 400 }
    );
  }

  // Confirm the account belongs to the applicant before we store it.
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
      store_name: storeName,
      slug,
      description,
      paystack_bank_code: bankCode,
      paystack_account_number: accountNumber,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    vendor: data,
    verifiedAccountName: resolvedAccountName,
  });
}