import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { Pagination } from "@/app/components/pagination";
import ProductActions from "./product-actions";

const PAGE_SIZE = 20;

export default async function VendorProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: vendor } = await supabase
    .from("vendors")
        .select("id, store_name, slug, status")
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

  const { data: products, count } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <DashboardShell
      title={vendor.store_name}
      subtitle={
        vendor.status === "approved"
          ? "Your listings"
          : "Pending approval — listings won't be visible to customers yet"
      }
      nav={[
        { href: "/vendor/products", label: "Products" },
        { href: "/vendor/orders", label: "Orders" },
      ]}
    >
      <div className="flex justify-between items-center mb-6">
        {vendor.status === "approved" ? (
          <Link
            href={`/store/${vendor.slug}`}
            className="text-sm text-[var(--color-plum)] underline underline-offset-4"
          >
            View your storefront
          </Link>
        ) : (
          <span />
        )}
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={(p) => (p === 1 ? "/vendor/products" : `/vendor/products?page=${p}`)}
      />
    </DashboardShell>
  );
}