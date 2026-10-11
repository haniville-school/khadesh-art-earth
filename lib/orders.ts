import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/paystack";
import { notifyOrderPaid } from "@/lib/notifications";

/**
 * Marks an order paid, pays out order_items, decrements stock and sends
 * the confirmation emails. Called from both the confirmation page and
 * the Paystack webhook, so it must be safe to call repeatedly and
 * simultaneously: the order is claimed with a single atomic update, and
 * only the request that wins the claim does the stock and email work.
 */
export async function fulfillOrderByReference(reference: string) {
  const admin = createServiceRoleClient();

  const { data: order } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("paystack_reference", reference)
    .single();

  if (!order) {
    return { ok: false as const, error: "Order not found" };
  }

  // Anything other than pending/cancelled was already paid and is somewhere
  // in fulfillment (paid, processing, shipped or delivered).
  if (order.status !== "pending" && order.status !== "cancelled") {
    return { ok: true as const, order, alreadyProcessed: true };
  }

  const verification = await verifyTransaction(reference);

  if (verification.status !== "success") {
    if (order.status === "pending") {
      await admin
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id)
        .eq("status", "pending");
    }
    return { ok: true as const, order, failed: true as const };
  }

  // Atomic claim: only one concurrent caller gets a row back.
  const { data: claimed } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", order.id)
    .in("status", ["pending", "cancelled"])
    .select("id");

  if (!claimed || claimed.length === 0) {
    return { ok: true as const, order, alreadyProcessed: true };
  }

  for (const item of order.order_items) {
    await admin
      .from("order_items")
      .update({ payout_status: "paid" })
      .eq("id", item.id);

    const { data: product } = await admin
      .from("products")
      .select("stock")
      .eq("id", item.product_id)
      .single();

    if (product) {
      await admin
        .from("products")
        .update({ stock: Math.max(0, product.stock - item.quantity) })
        .eq("id", item.product_id);
    }
  }

  await notifyOrderPaid(order.id);

  const { data: updatedOrder } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", order.id)
    .single();

  return { ok: true as const, order: updatedOrder };
}