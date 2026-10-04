import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";
import SignOutButton from "./sign-out-button";

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, status")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <DashboardShell title={profile?.full_name || "Your account"} subtitle={user.email ?? undefined}>
      <div className="space-y-3">
        {vendor ? (
          <Link
            href="/vendor/products"
            className="block border border-[var(--color-line)] rounded-sm px-4 py-3 hover:border-[var(--color-moss)] transition-colors"
          >
            Manage your shop
            <span className="block text-xs text-[var(--color-ink-50)] mt-0.5">
              {vendor.status === "approved" ? "Approved" : "Pending approval"}
            </span>
          </Link>
        ) : (
          <Link
            href="/vendor/apply"
            className="block border border-[var(--color-line)] rounded-sm px-4 py-3 hover:border-[var(--color-plum)] transition-colors text-[var(--color-plum)]"
          >
            Become a vendor
          </Link>
        )}

        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="block border border-[var(--color-line)] rounded-sm px-4 py-3 hover:border-[var(--color-moss)] transition-colors"
          >
            Admin dashboard
          </Link>
        )}

        <div className="pt-3">
          <SignOutButton />
        </div>
      </div>
    </DashboardShell>
  );
}