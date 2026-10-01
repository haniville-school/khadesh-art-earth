import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ApproveButton from "./approve-button";

export default async function AdminVendorsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .order("created_at", { ascending: false });

  const pending = vendors?.filter((v) => v.status === "pending") ?? [];
  const others = vendors?.filter((v) => v.status !== "pending") ?? [];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-6">Vendor applications</h1>

      <h2 className="text-lg font-medium mb-3">Pending ({pending.length})</h2>
      <div className="space-y-4 mb-10">
        {pending.length === 0 && <p className="text-gray-500">Nothing pending.</p>}
        {pending.map((vendor) => (
          <div key={vendor.id} className="border rounded p-4 flex justify-between items-start">
            <div>
              <p className="font-medium">{vendor.store_name}</p>
              <p className="text-sm text-gray-600">{vendor.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                Bank: {vendor.paystack_bank_code} · Acct: {vendor.paystack_account_number}
              </p>
            </div>
            <ApproveButton vendorId={vendor.id} />
          </div>
        ))}
      </div>

      <h2 className="text-lg font-medium mb-3">All other vendors</h2>
      <div className="space-y-2">
        {others.map((vendor) => (
          <div key={vendor.id} className="border rounded p-3 flex justify-between text-sm">
            <span>{vendor.store_name}</span>
            <span className="text-gray-500">{vendor.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}