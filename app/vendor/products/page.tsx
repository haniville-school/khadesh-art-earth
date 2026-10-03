import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";
import ProductActions from "./product-actions";

export default async function VendorProductsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, store_name, status")
    .eq("profile_id", user.id)
    .single();

  if (!vendor) {
    return (
      <DashboardShell title="Sell on Khadesh Art">
        <p className="text-[var(--color-ink-70)]">
          You don&apos;t have a vendor account yet.{" "}
          <Link href="/vendor/apply" className="text-[var(--color-plum)] underline underline-offset-4">
            Apply here
          </Link>
          .
        </p>
      </DashboardShell>
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardShell
      title={vendor.store_name}
      subtitle={
        vendor.status === "approved"
          ? "Your listings"
          : "Pending approval — listings won't be visible to customers yet"
      }
    >
      <div className="flex justify-end mb-6">
        <Link
          href="/vendor/products/new"
          className="bg-[var(--color-moss)] text-white rounded-sm px-4 py-2 text-sm hover:bg-[var(--color-moss-dark)] transition-colors"
        >
          Add a piece
        </Link>
      </div>

      {(!products || products.length === 0) && (
        <p className="text-[var(--color-ink-60)] text-center py-12">
          Nothing listed yet. Your first piece is one click away.
        </p>
      )}

      <div className="divide-y divide-[var(--color-line)]">
        {products?.map((product) => (
          <div key={product.id} className="flex justify-between items-center py-4 gap-4">
            <div className="min-w-0">
              <p className="truncate">{product.title}</p>
              <p className="text-sm text-[var(--color-ink-50)]">
                ₦{Number(product.price).toLocaleString()} · {product.stock} in stock ·{" "}
                {product.status}
              </p>
            </div>
            <ProductActions product={product} />
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}