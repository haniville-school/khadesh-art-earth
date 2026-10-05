import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, title, slug, price, images, vendors(store_name)")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("name, slug").order("name"),
  ]);

  const featured = (products ?? []).slice(0, 3);
  const all = products ?? [];

  return (
    <div>
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="font-display text-5xl leading-[1.1] mb-6">
            Decor you love,
            <br />
            or the makings of your own.
          </h1>
          <p className="text-[var(--color-ink-70)] mb-8 max-w-sm leading-relaxed">
            Finished art, pottery, and flowers, alongside the seeds, vases,
            resin, and tools behind them — from independent makers and
            growers.
          </p>
          <Link
            href="#collection"
            className="inline-block bg-[var(--color-moss)] text-white px-6 py-3 rounded-sm hover:bg-[var(--color-moss-dark)] transition-colors"
          >
            Browse the collection
          </Link>
        </div>

        <div className="relative h-72 hidden md:block">
          {featured.map((product, i) => (
            <div
              key={product.id}
              className="absolute w-40 h-40 rounded-sm overflow-hidden border-4 border-[var(--color-paper-light)] shadow-sm bg-[var(--color-line)]"
              style={{
                top: `${i * 36}px`,
                left: `${i * 72}px`,
                transform: `rotate(${(i - 1) * 6}deg)`,
                zIndex: i,
              }}
            >
              {product.images?.[0] && (
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {categories && categories.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-8">
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="text-sm border border-[var(--color-line)] rounded-full px-3 py-1 hover:border-[var(--color-moss)] transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="collection" className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="font-display text-2xl mb-6">Fresh from the workshop</h2>

        {all.length === 0 && (
          <p className="text-[var(--color-ink-60)]">
            No pieces listed yet — check back soon.
          </p>
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
              <span className="text-xs text-[var(--color-ink-50)] hidden sm:block w-32 text-right shrink-0 truncate">
                {(product as any).vendors?.store_name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}