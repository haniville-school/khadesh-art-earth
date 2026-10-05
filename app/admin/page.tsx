import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";

export default async function AdminHomePage() {
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

  const [{ count: pendingVendors }, { count: approvedVendors }, { count: products }, { count: paidOrders }] =
    await Promise.all([
      supabase.from("vendors").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("vendors").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "paid"),
    ]);

  const stats = [
    { label: "Vendors awaiting approval", value: pendingVendors ?? 0 },
    { label: "Approved vendors", value: approvedVendors ?? 0 },
    { label: "Listed products", value: products ?? 0 },
    { label: "Paid orders", value: paidOrders ?? 0 },
  ];

  return (
    <DashboardShell
      title="Admin"
      nav={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/vendors", label: "Vendors" },
        { href: "/admin/categories", label: "Categories" },
      ]}
    >
      <div className="grid grid-cols-2 gap-px bg-[var(--color-line)] border border-[var(--color-line)]">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[var(--color-paper-light)] p-5">
            <p className="font-display text-3xl">{stat.value}</p>
            <p className="text-sm text-[var(--color-ink-60)] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {(pendingVendors ?? 0) > 0 && (
        <p className="mt-6 text-sm">
          <Link href="/admin/vendors" className="text-[var(--color-plum)] underline underline-offset-4">
            {pendingVendors} vendor{pendingVendors === 1 ? "" : "s"} waiting on your review
          </Link>
        </p>
      )}
    </DashboardShell>
  );
}