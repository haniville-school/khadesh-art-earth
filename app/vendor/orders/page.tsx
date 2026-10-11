import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import StatusBadge from "@/app/components/status-badge";
import FulfillmentControls from "@/app/components/fulfillment-controls";

const PAID = ["paid", "processing", "shipped", "delivered"];

export default async function VendorOrdersPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!vendor) redirect("/vendor/apply");

  // Orders are hidden from vendors by row-level security, so this
  // read uses the service role. It is strictly limited to this vendor's
  // own items, and the vendor id comes from the signed-in session above.
  const admin = createServiceRoleClient();
  const { data: items } = await admin
    .from("order_items")
    .select(
      "*, products(title), orders(id, created_at, status, shipping_address, profiles(full_name, phone))"
    )
    .eq("vendor_id", vendor.id);

  const byOrder = new Map<string, { order: any; items: any[] }>();
  for (const item of items ?? []) {
    const order = (item as any).orders;
    if (!order || !PAID.includes(order.status)) continue;
    if (!byOrder.has(order.id)) byOrder.set(order.id, { order, items: [] });
    byOrder.get(order.id)!.items.push(item);
  }

  const groups = Array.from(byOrder.values()).sort(
    (a, b) => new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime()
  );

  return (
    <DashboardShell
      title="Your sales"
      nav={[
        { href: "/vendor/products", label: "Products" },
        { href: "/vendor/orders", label: "Orders" },
      ]}
    >
      {groups.length === 0 && <p className="text-[var(--color-ink-60)]">No sales yet.</p>}

      <div className="space-y-4">
        {groups.map(({ order, items }) => {
          const addr = order.shipping_address;
          return (
            <div key={order.id} className="border border-[var(--color-line)] rounded-sm p-4">
              <div className="mb-3">
                <p>{order.profiles?.full_name ?? "Customer"}</p>
                <p className="text-xs text-[var(--color-ink-50)]">
                  {new Date(order.created_at).toLocaleDateString()} ·{" "}
                  {addr?.phone ?? order.profiles?.phone}
                </p>
                {addr ? (
                  <p className="text-xs text-[var(--color-ink-50)] mt-1">
                    Ship to: {addr.addressLine1}
                    {addr.addressLine2 && `, ${addr.addressLine2}`}, {addr.city}, {addr.state}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--color-ink-50)] mt-1">
                    No shipping address on file
                  </p>
                )}
              </div>

              <div className="divide-y divide-[var(--color-line)]">
                {items.map((item: any) => (
                  <div key={item.id} className="py-3">
                    <div className="flex justify-between items-center gap-4">
                      <div className="min-w-0">
                        <p className="truncate">
                          {item.products?.title ?? "Product no longer available"} × {item.quantity}
                        </p>
                        <p className="text-xs text-[var(--color-ink-50)]">
                          Your payout ₦{Number(item.vendor_payout_amount).toLocaleString()}
                        </p>
                      </div>
                      <StatusBadge status={item.fulfillment_status} />
                    </div>
                    <FulfillmentControls
                      itemId={item.id}
                      current={item.fulfillment_status}
                      role="vendor"
                      note={item.tracking_note}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}