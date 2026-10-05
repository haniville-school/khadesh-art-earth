import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AddToCartButton from "./add-to-cart-button";
import ImageGallery from "./image-gallery";

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
    <div className="max-w-4xl mx-auto px-6 py-14 grid md:grid-cols-2 gap-12">
      <ImageGallery images={product.images ?? []} title={product.title} />

      <div>
        <h1 className="font-display text-3xl mb-1">{product.title}</h1>
        <p className="text-sm text-[var(--color-ink-50)] mb-4">
          by {product.vendors?.store_name}
        </p>
        <p className="font-display text-2xl text-[var(--color-ochre)] mb-5">
          ₦{Number(product.price).toLocaleString()}
        </p>
        <p className="text-[var(--color-ink-70)] mb-6 whitespace-pre-line leading-relaxed">
          {product.description}
        </p>
        <p className="text-sm text-[var(--color-ink-50)] mb-6">
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