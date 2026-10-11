import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddToCartButton from "./add-to-cart-button";
import ImageGallery from "./image-gallery";
import ReviewForm from "./review-form";
import DeleteReviewButton from "./delete-review-button";
import StarRating from "@/app/components/star-rating";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, vendors(store_name, slug, profile_id)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!product) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, body, created_at, reviewer_name, customer_id")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false });

  const list = reviews ?? [];
  const average = list.length ? list.reduce((sum, r) => sum + r.rating, 0) / list.length : 0;

  let isAdmin = false;
  let canReview = false;
  const isOwnProduct = !!user && (product as any).vendors?.profile_id === user.id;
  const ownReview = user ? list.find((r) => r.customer_id === user.id) ?? null : null;

  if (user) {
    const [{ data: profile }, { data: purchases }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("order_items")
        .select("id, orders!inner(customer_id, status)")
        .eq("product_id", product.id)
        .eq("orders.customer_id", user.id)
        .in("orders.status", ["paid", "processing", "shipped", "delivered"])
        .in("fulfillment_status", ["shipped", "delivered"])
        .limit(1),
    ]);

    isAdmin = profile?.role === "admin";
    canReview = !!purchases?.length && !isOwnProduct;
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto px-6 py-14 grid md:grid-cols-2 gap-12">
        <ImageGallery images={product.images ?? []} title={product.title} />

        <div>
          <h1 className="font-display text-3xl mb-1">{product.title}</h1>
          <p className="text-sm text-[var(--color-ink-50)] mb-3">
            by{" "}
            <Link
              href={`/store/${product.vendors?.slug}`}
              className="text-[var(--color-plum)] underline underline-offset-4"
            >
              {product.vendors?.store_name}
            </Link>
          </p>

          {list.length > 0 && (
            <a href="#reviews" className="inline-flex items-center gap-2 text-sm mb-4">
              <StarRating value={average} />
              <span className="text-[var(--color-ink-60)]">
                {average.toFixed(1)} ({list.length} review{list.length === 1 ? "" : "s"})
              </span>
            </a>
          )}

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

      <section id="reviews" className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="font-display text-2xl mb-6">Reviews</h2>

        {canReview ? (
          <div className="mb-8 max-w-lg">
            <h3 className="text-sm text-[var(--color-ink-60)] mb-3">
              {ownReview ? "Your review" : "Review this piece"}
            </h3>
            <ReviewForm
              productId={product.id}
              existing={
                ownReview
                  ? { id: ownReview.id, rating: ownReview.rating, body: ownReview.body }
                  : null
              }
            />
          </div>
        ) : !user ? (
          <p className="text-sm text-[var(--color-ink-50)] mb-8">
            <Link
              href={`/login?next=/products/${slug}`}
              className="text-[var(--color-plum)] underline underline-offset-4"
            >
              Log in
            </Link>{" "}
            to review pieces you&apos;ve bought.
          </p>
        ) : !isOwnProduct ? (
          <p className="text-sm text-[var(--color-ink-50)] mb-8">
            You can review this piece once it has shipped to you.
          </p>
        ) : null}

        {list.length === 0 && <p className="text-[var(--color-ink-60)]">No reviews yet.</p>}

        <div className="divide-y divide-[var(--color-line)] max-w-2xl">
          {list.map((r) => (
            <div key={r.id} className="py-4">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <StarRating value={r.rating} />
                <span className="text-sm">{r.reviewer_name ?? "Customer"}</span>
                <span className="text-xs text-[var(--color-ink-50)]">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
                <span className="text-xs text-[var(--color-moss)]">Verified purchase</span>
              </div>
              {r.body && (
                <p className="text-[var(--color-ink-70)] whitespace-pre-line leading-relaxed">
                  {r.body}
                </p>
              )}
              {isAdmin && (
                <div className="mt-2">
                  <DeleteReviewButton reviewId={r.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}