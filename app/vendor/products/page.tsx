import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
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
      <div className="max-w-2xl mx-auto py-12 px-4">
        <p>
          You don&apos;t have a vendor account yet.{" "}
          <Link href="/vendor/apply" className="underline">
            Apply here
          </Link>
          .
        </p>
      </div>
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{vendor.store_name}&apos;s products</h1>
        <Link
          href="/vendor/products/new"
          className="bg-black text-white rounded px-4 py-2 text-sm"
        >
          + Add product
        </Link>
      </div>

      {vendor.status !== "approved" && (
        <p className="text-sm text-amber-600 mb-6">
          Your store is still pending approval. Products you create won&apos;t be
          visible to customers until an admin approves your store.
        </p>
      )}

      <div className="space-y-3">
        {(!products || products.length === 0) && (
          <p className="text-gray-500">No products yet.</p>
        )}
        {products?.map((product) => (
          <div
            key={product.id}
            className="border rounded p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{product.title}</p>
              <p className="text-sm text-gray-600">
                ₦{Number(product.price).toLocaleString()} · stock: {product.stock} ·{" "}
                {product.status}
              </p>
            </div>
            <ProductActions product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}