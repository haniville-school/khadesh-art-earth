import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { render, money, SITE_URL } from "@/lib/email-templates";

type AdminClient = ReturnType<typeof createServiceRoleClient>;

async function getUserEmail(admin: AdminClient, userId: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user?.email ?? null;
}

/** Customer confirmation + one "new sale" email per vendor in the order. */
export async function notifyOrderPaid(orderId: string) {
  try {
    const admin = createServiceRoleClient();

    const { data: order } = await admin
      .from("orders")
      .select(
        "*, profiles(full_name), order_items(*, products(title), vendors(id, store_name, profile_id))"
      )
      .eq("id", orderId)
      .single();
    if (!order) return;

    const items = order.order_items as any[];
    const customerName = (order as any).profiles?.full_name ?? "there";
    const sends: Promise<unknown>[] = [];

    const customerEmail = await getUserEmail(admin, order.customer_id);
    if (customerEmail) {
      const fee = Number(order.transaction_fee_amount ?? 0);
      const email = render({
        subject: `Order confirmed - ${money(order.total_amount)}`,
        heading: "Thanks for your order",
        paragraphs: [
          `Hi ${customerName}, we've received your payment. Each seller prepares and ships their own items, and we'll email you as items ship.`,
        ],
        rows: [
          ...items.map((i) => ({
            label: `${i.products?.title ?? "Item"} × ${i.quantity}`,
            value: money(i.subtotal),
          })),
          ...(fee > 0 ? [{ label: "Transaction fee", value: money(fee) }] : []),
          { label: "Total", value: money(order.total_amount), strong: true },
        ],
        cta: { label: "View your order", url: `${SITE_URL}/account/orders` },
      });
      sends.push(sendEmail({ to: customerEmail, ...email }));
    }

    const byVendor = new Map<string, { vendor: any; items: any[] }>();
    for (const item of items) {
      const vendor = item.vendors;
      if (!vendor) continue;
      if (!byVendor.has(vendor.id)) byVendor.set(vendor.id, { vendor, items: [] });
      byVendor.get(vendor.id)!.items.push(item);
    }

    for (const { vendor, items: vendorItems } of byVendor.values()) {
      const vendorEmail = await getUserEmail(admin, vendor.profile_id);
      if (!vendorEmail) continue;

      const payout = vendorItems.reduce((sum, i) => sum + Number(i.vendor_payout_amount), 0);
      const email = render({
        subject: `New sale - ${vendorItems.length} item${vendorItems.length === 1 ? "" : "s"}`,
        heading: "You have a new order",
        paragraphs: [
          `Hi ${vendor.store_name}, a customer has paid for the items below. Please prepare them and mark them shipped in your dashboard. The customer's delivery details are in your dashboard.`,
        ],
        rows: [
          ...vendorItems.map((i) => ({
            label: `${i.products?.title ?? "Item"} × ${i.quantity}`,
            value: money(i.vendor_payout_amount),
          })),
          { label: "Your payout", value: money(payout), strong: true },
        ],
        cta: { label: "Open your orders", url: `${SITE_URL}/vendor/orders` },
      });
      sends.push(sendEmail({ to: vendorEmail, ...email }));
    }

    await Promise.allSettled(sends);
  } catch (err) {
    console.error("notifyOrderPaid failed:", err);
  }
}

/** Tells the customer an item has shipped. */
export async function notifyItemShipped(itemId: string) {
  try {
    const admin = createServiceRoleClient();

    const { data: item } = await admin
      .from("order_items")
      .select(
        "quantity, tracking_note, products(title), vendors(store_name), orders(customer_id, profiles(full_name))"
      )
      .eq("id", itemId)
      .single();
    if (!item) return;

    const order = (item as any).orders;
    const customerEmail = await getUserEmail(admin, order.customer_id);
    if (!customerEmail) return;

    const title = (item as any).products?.title ?? "your item";
    const store = (item as any).vendors?.store_name ?? "the seller";
    const name = order.profiles?.full_name ?? "there";

    const email = render({
      subject: `Your item has shipped: ${title}`,
      heading: "Your item is on its way",
      paragraphs: [
        `Hi ${name}, ${store} has shipped ${title} (× ${item.quantity}).`,
        ...(item.tracking_note ? [`Note from the seller: ${item.tracking_note}`] : []),
        "When it arrives, please confirm receipt in your order history so the order can be closed.",
      ],
      cta: { label: "View your order", url: `${SITE_URL}/account/orders` },
    });

    await sendEmail({ to: customerEmail, ...email });
  } catch (err) {
    console.error("notifyItemShipped failed:", err);
  }
}

/** Tells a vendor their store application was approved. */
export async function notifyVendorApproved(vendorId: string) {
  try {
    const admin = createServiceRoleClient();

    const { data: vendor } = await admin
      .from("vendors")
      .select("store_name, profile_id")
      .eq("id", vendorId)
      .single();
    if (!vendor) return;

    const vendorEmail = await getUserEmail(admin, vendor.profile_id);
    if (!vendorEmail) return;

    const email = render({
      subject: `${vendor.store_name} is approved on Khadesh Art`,
      heading: "Your store is approved",
      paragraphs: [
        `Good news: ${vendor.store_name} has been approved. You can now list pieces, and customers will be able to see and buy them.`,
      ],
      cta: { label: "Add your first piece", url: `${SITE_URL}/vendor/products` },
    });

    await sendEmail({ to: vendorEmail, ...email });
  } catch (err) {
    console.error("notifyVendorApproved failed:", err);
  }
}