import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, title, slug, price, images")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-8">Shop</h1>

      {(!products || products.length === 0) && (
        <p className="text-gray-500">No products available yet.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {products?.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="block group"
          >
            <div className="aspect-square bg-gray-100 rounded overflow-hidden relative mb-2">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No image
                </div>
              )}
            </div>
            <p className="text-sm font-medium">{product.title}</p>
            <p className="text-sm text-gray-600">
              ₦{Number(product.price).toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}