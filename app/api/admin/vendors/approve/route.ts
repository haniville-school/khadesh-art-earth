import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createPaystackSubaccount } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Confirm the caller is an admin before doing anything else.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { vendorId } = await req.json();
  if (!vendorId) {
    return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
  }

  const { data: vendor, error: fetchError } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", vendorId)
    .single();

  if (fetchError || !vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  if (vendor.status === "approved") {
    return NextResponse.json({ error: "Vendor already approved" }, { status: 400 });
  }

  let subaccountCode: string;
  try {
    const result = await createPaystackSubaccount({
      storeName: vendor.store_name,
      bankCode: vendor.paystack_bank_code,
      accountNumber: vendor.paystack_account_number,
      commissionPercent: vendor.commission_rate,
    });
    subaccountCode = result.data!.subaccount_code;
  } catch (err: any) {
    return NextResponse.json(
      { error: `Paystack subaccount creation failed: ${err.message}` },
      { status: 502 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("vendors")
    .update({
      status: "approved",
      paystack_subaccount_code: subaccountCode,
    })
    .eq("id", vendorId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ vendor: updated });
}