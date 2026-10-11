import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { notifyItemShipped } from "@/lib/notifications";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const RANK: Record<string, number> = { pending: 0, processing: 1, shipped: 2, delivered: 3 };
const PAID_ORDER_STATUSES = ["paid", "processing", "shipped", "delivered"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { status, note } = (await req.json()) as { status: Status; note?: string };
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  const { data: item } = await admin
    .from("order_items")
    .select("id, order_id, fulfillment_status, orders(customer_id, status), vendors(profile_id)")
    .eq("id", id)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const order = (item as any).orders;
  const vendor = (item as any).vendors;
  const current = item.fulfillment_status as Status;

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isVendorOwner = vendor?.profile_id === user.id;
  const isCustomer = order?.customer_id === user.id;

  if (!isAdmin) {
    if (!PAID_ORDER_STATUSES.includes(order?.status)) {
      return NextResponse.json({ error: "This order hasn't been paid" }, { status: 400 });
    }

    if (isVendorOwner) {
      if (status !== "processing" && status !== "shipped") {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      }
      if (current === "delivered" || current === "cancelled") {
        return NextResponse.json({ error: "This item is already closed" }, { status: 400 });
      }
      if (RANK[status] < RANK[current]) {
        return NextResponse.json({ error: "Can't move an item backwards" }, { status: 400 });
      }
    } else if (isCustomer) {
      if (status !== "delivered" || current !== "shipped") {
        return NextResponse.json(
          { error: "You can only confirm items that have shipped" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { fulfillment_status: status };
  if (note !== undefined) update.tracking_note = note.trim() || null;
  if (status === "shipped" && current !== "shipped") update.shipped_at = now;
  if (status === "delivered") update.delivered_at = now;

  const { error: updateError } = await admin.from("order_items").update(update).eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // Roll the item statuses up into the order-level status
  const { data: siblings } = await admin
    .from("order_items")
    .select("fulfillment_status")
    .eq("order_id", item.order_id);

  const active = (siblings ?? [])
    .map((s) => s.fulfillment_status)
    .filter((s) => s !== "cancelled");

  if (active.length > 0 && PAID_ORDER_STATUSES.includes(order.status)) {
    let rolled = "paid";
    if (active.every((s) => s === "delivered")) rolled = "delivered";
    else if (active.some((s) => s === "shipped" || s === "delivered")) rolled = "shipped";
    else if (active.some((s) => s === "processing")) rolled = "processing";

    await admin.from("orders").update({ status: rolled }).eq("id", item.order_id);
  }

    if (status === "shipped" && current !== "shipped") {
    await notifyItemShipped(id);
  }

  return NextResponse.json({ ok: true, status });
}