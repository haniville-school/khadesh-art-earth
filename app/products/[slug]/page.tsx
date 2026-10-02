import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import AddToCartButton from "./add-to-cart-button";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, vendors(store_name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!product) notFound();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 grid md:grid-cols-2 gap-10">
      <div className="aspect-square bg-gray-100 rounded overflow-hidden relative">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-semibold mb-1">{product.title}</h1>
        <p className="text-sm text-gray-500 mb-4">
          Sold by {product.vendors?.store_name}
        </p>
        <p className="text-xl font-medium mb-4">
          ₦{Number(product.price).toLocaleString()}
        </p>
        <p className="text-gray-700 mb-6 whitespace-pre-line">
          {product.description}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </p>

        <AddToCartButton
          productId={product.id}
          vendorId={product.vendor_id}
          title={product.title}
          price={Number(product.price)}
          image={product.images?.[0] ?? null}
          stock={product.stock}
        />
      </div>
    </div>
  );
}