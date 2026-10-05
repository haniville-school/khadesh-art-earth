import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createServerSupabaseClient();

  const { data: results } = query
    ? await supabase
        .from("products")
        .select("id, title, slug, price, images, vendors(store_name)")
        .eq("status", "published")
        .ilike("title", `%${query}%`)
        .order("created_at", { ascending: false })
    : { data: [] };

  const products = results ?? [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-display text-2xl mb-1">
        {query ? `Results for "${query}"` : "Search"}
      </h1>
      <p className="text-sm text-[var(--color-ink-50)] mb-8">
        {query && `${products.length} piece${products.length === 1 ? "" : "s"} found`}
      </p>

      {query && products.length === 0 && (
        <p className="text-[var(--color-ink-60)]">
          Nothing matched &quot;{query}&quot;. Try a different word, or browse the
          full collection from the homepage.
        </p>
      )}

      <div className="divide-y divide-[var(--color-line)]">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="flex items-center gap-4 py-4 group"
          >
            <div className="w-16 h-16 rounded-sm overflow-hidden relative shrink-0 bg-[var(--color-line)]">
              {product.images?.[0] && (
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1 flex items-baseline gap-2 overflow-hidden min-w-0">
              <span className="group-hover:text-[var(--color-plum)] transition-colors truncate">
                {product.title}
              </span>
              <span className="flex-1 border-b border-dotted border-[var(--color-line)] translate-y-[-4px]" />
              <span className="text-[var(--color-ochre)] font-medium whitespace-nowrap">
                ₦{Number(product.price).toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-[var(--color-ink-50)] hidden sm:block w-32 text-right shrink-0 truncate">
              {(product as any).vendors?.store_name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}