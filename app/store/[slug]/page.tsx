import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pagination } from "@/app/components/pagination";

const PAGE_SIZE = 20;

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createServerSupabaseClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, store_name, description, created_at")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (!vendor) notFound();

  const { data: products, count } = await supabase
    .from("products")
    .select("id, title, slug, price, images", { count: "exact" })
    .eq("vendor_id", vendor.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(from, to);

  const all = products ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const since = new Date(vendor.created_at).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl mb-1">{vendor.store_name}</h1>
      <p className="text-sm text-[var(--color-ink-50)] mb-4">
        {count ?? 0} piece{(count ?? 0) === 1 ? "" : "s"} · Selling since {since}
      </p>
      {vendor.description && (
        <p className="text-[var(--color-ink-70)] mb-8 max-w-xl leading-relaxed whitespace-pre-line">
          {vendor.description}
        </p>
      )}

      {all.length === 0 && (
        <p className="text-[var(--color-ink-60)]">Nothing listed yet.</p>
      )}

      <div className="divide-y divide-[var(--color-line)]">
        {all.map((product) => (
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
          </Link>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={(p) => (p === 1 ? `/store/${slug}` : `/store/${slug}?page=${p}`)}
      />
    </div>
  );
}