import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import StatusBadge from "@/app/components/status-badge";
import FulfillmentControls from "@/app/components/fulfillment-controls";

export default async function AdminOrdersPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles(full_name, phone), order_items(*, products(title), vendors(store_name))")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell
      title="Orders"
      nav={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/vendors", label: "Vendors" },
        { href: "/admin/categories", label: "Categories" },
        { href: "/admin/orders", label: "Orders" },
      ]}
    >
      {(!orders || orders.length === 0) && (
        <p className="text-[var(--color-ink-60)]">No orders yet.</p>
      )}

      <div className="space-y-4">
        {orders?.map((order: any) => (
          <div key={order.id} className="border border-[var(--color-line)] rounded-sm p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p>{order.profiles?.full_name ?? "Unknown customer"}</p>
                <p className="text-xs text-[var(--color-ink-50)]">
                  {order.profiles?.phone} · {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="divide-y divide-[var(--color-line)] mb-3">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="py-2">
                  <div className="flex justify-between items-center text-sm gap-3">
                    <span>
                      {item.products?.title ?? "Deleted product"} × {item.quantity}{" "}
                      <span className="text-[var(--color-ink-50)]">
                        ({item.vendors?.store_name})
                      </span>
                    </span>
                    <span className="text-[var(--color-ink-60)] shrink-0">
                      ₦{Number(item.subtotal).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={item.fulfillment_status} />
                    {item.tracking_note && (
                      <p className="text-xs text-[var(--color-ink-50)] mt-1">
                        Note: {item.tracking_note}
                      </p>
                    )}
                    <FulfillmentControls
                      itemId={item.id}
                      current={item.fulfillment_status}
                      role="admin"
                      note={item.tracking_note}
                    />
                  </div>
                </div>
              ))}
            </div>

            {order.shipping_address && (
              <p className="text-xs text-[var(--color-ink-50)] mb-3">
                Ship to: {order.shipping_address.addressLine1}
                {order.shipping_address.addressLine2 && `, ${order.shipping_address.addressLine2}`},{" "}
                {order.shipping_address.city}, {order.shipping_address.state}
              </p>
            )}

            <div className="flex justify-between pt-2 border-t border-[var(--color-line)]">
              <span className="font-medium">Total</span>
              <span className="font-medium text-[var(--color-ochre)]">
                ₦{Number(order.total_amount).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}