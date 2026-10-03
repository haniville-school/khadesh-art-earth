import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import ApproveButton from "./approve-button";

export default async function AdminVendorsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .order("created_at", { ascending: false });

  const pending = vendors?.filter((v) => v.status === "pending") ?? [];
  const others = vendors?.filter((v) => v.status !== "pending") ?? [];

  return (
    <DashboardShell
      title="Vendors"
      nav={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/vendors", label: "Vendors" },
      ]}
    >
      <h2 className="text-sm text-[var(--color-ink-60)] mb-3">
        Awaiting approval ({pending.length})
      </h2>
      <div className="divide-y divide-[var(--color-line)] mb-10">
        {pending.length === 0 && (
          <p className="text-[var(--color-ink-50)] py-4 text-sm">Nothing pending.</p>
        )}
        {pending.map((vendor) => (
          <div key={vendor.id} className="py-4 flex justify-between items-start gap-4">
            <div className="min-w-0">
              <p>{vendor.store_name}</p>
              {vendor.description && (
                <p className="text-sm text-[var(--color-ink-60)]">{vendor.description}</p>
              )}
              <p className="text-xs text-[var(--color-ink-40)] mt-1">
                Bank {vendor.paystack_bank_code} · Account {vendor.paystack_account_number}
              </p>
            </div>
            <ApproveButton vendorId={vendor.id} />
          </div>
        ))}
      </div>

      <h2 className="text-sm text-[var(--color-ink-60)] mb-3">All other vendors</h2>
      <div className="divide-y divide-[var(--color-line)]">
        {others.map((vendor) => (
          <div key={vendor.id} className="py-3 flex justify-between text-sm">
            <span>{vendor.store_name}</span>
            <span className="text-[var(--color-ink-50)]">{vendor.status}</span>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}