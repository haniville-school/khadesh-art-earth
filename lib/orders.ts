import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/paystack";

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

  if (order.status === "paid") {
    return { ok: true as const, order, alreadyProcessed: true };
  }

  const verification = await verifyTransaction(reference);

  if (verification.status !== "success") {
    await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    return { ok: true as const, order, failed: true as const };
  }

  await admin.from("orders").update({ status: "paid" }).eq("id", order.id);

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

  const { data: updatedOrder } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", order.id)
    .single();

  return { ok: true as const, order: updatedOrder };
}