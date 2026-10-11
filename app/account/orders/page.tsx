import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import StatusBadge from "@/app/components/status-badge";
import FulfillmentControls from "@/app/components/fulfillment-controls";

export default async function CustomerOrdersPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*, products(title))")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardShell title="Your orders">
      {(!orders || orders.length === 0) && (
        <p className="text-[var(--color-ink-60)]">You haven&apos;t placed an order yet.</p>
      )}

      <div className="space-y-4">
        {orders?.map((order) => {
          const showFulfillment = !["pending", "cancelled", "refunded"].includes(order.status);
          return (
            <div key={order.id} className="border border-[var(--color-line)] rounded-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-[var(--color-ink-50)]">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
                <StatusBadge status={order.status} />
              </div>

              <div className="divide-y divide-[var(--color-line)] mb-3">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="py-2">
                    <div className="flex justify-between items-center text-sm gap-3">
                      <span>
                        {item.products?.title ?? "Product no longer available"} × {item.quantity}
                      </span>
                      <span className="text-[var(--color-ink-60)] shrink-0">
                        ₦{Number(item.subtotal).toLocaleString()}
                      </span>
                    </div>

                    {showFulfillment && (
                      <div className="mt-1">
                        <StatusBadge status={item.fulfillment_status} />
                        {item.tracking_note && (
                          <p className="text-xs text-[var(--color-ink-50)] mt-1">
                            Seller note: {item.tracking_note}
                          </p>
                        )}
                        <FulfillmentControls
                          itemId={item.id}
                          current={item.fulfillment_status}
                          role="customer"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2 border-t border-[var(--color-line)]">
                <span className="font-medium">Total</span>
                <span className="font-medium text-[var(--color-ochre)]">
                  ₦{Number(order.total_amount).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}