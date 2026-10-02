import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { initializeTransaction } from "@/lib/paystack";
import { calculateTransactionFee } from "@/lib/fees";

type CartItemInput = {
  productId: string;
  quantity: number;
};

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in to check out" }, { status: 401 });
  }

  const { items, shippingAddress } = (await req.json()) as {
    items: CartItemInput[];
    shippingAddress?: Record<string, unknown>;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  const productIds = items.map((i) => i.productId);
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, title, price, stock, status, vendor_id, vendors(id, status, commission_rate, paystack_subaccount_code)")
    .in("id", productIds);

  if (productsError || !products) {
    return NextResponse.json({ error: "Could not load products" }, { status: 400 });
  }

  const lineItems = [];
  for (const cartItem of items) {
    const product = products.find((p) => p.id === cartItem.productId);
    if (!product) {
      return NextResponse.json({ error: `Product ${cartItem.productId} not found` }, { status: 400 });
    }
    if (product.status !== "published") {
      return NextResponse.json({ error: `${product.title} is no longer available` }, { status: 400 });
    }
    if (product.stock < cartItem.quantity) {
      return NextResponse.json({ error: `Not enough stock for ${product.title}` }, { status: 400 });
    }
    const vendor = (product as any).vendors;
    if (!vendor || vendor.status !== "approved" || !vendor.paystack_subaccount_code) {
      return NextResponse.json({ error: `${product.title}'s seller isn't set up to receive payments yet` }, { status: 400 });
    }

    const unitPrice = Number(product.price);
    const subtotal = unitPrice * cartItem.quantity;
    const platformFee = Math.round(subtotal * (Number(vendor.commission_rate) / 100));
    const vendorPayout = subtotal - platformFee;

    lineItems.push({
      product_id: product.id,
      vendor_id: vendor.id,
      quantity: cartItem.quantity,
      unit_price: unitPrice,
      subtotal,
      platform_fee_amount: platformFee,
      vendor_payout_amount: vendorPayout,
      vendor_subaccount_code: vendor.paystack_subaccount_code as string,
    });
  }

  const subtotalAmount = lineItems.reduce((sum, i) => sum + i.subtotal, 0);
  const transactionFee = calculateTransactionFee(subtotalAmount);
  const totalAmount = subtotalAmount + transactionFee;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      customer_id: user.id,
      status: "pending",
      total_amount: totalAmount,
      transaction_fee_amount: transactionFee,
      shipping_address: shippingAddress ?? null,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Could not create order" }, { status: 400 });
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    lineItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      vendor_id: item.vendor_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      platform_fee_amount: item.platform_fee_amount,
      vendor_payout_amount: item.vendor_payout_amount,
    }))
  );

  if (itemsError) {
    return NextResponse.json({ error: "Could not create order items" }, { status: 400 });
  }

  const vendorShares = new Map<string, number>();
  for (const item of lineItems) {
    vendorShares.set(
      item.vendor_subaccount_code,
      (vendorShares.get(item.vendor_subaccount_code) ?? 0) + item.vendor_payout_amount
    );
  }

  const reference = `order_${order.id}`;
  const origin = req.nextUrl.origin;

  try {
    const transaction = await initializeTransaction({
      email: user.email!,
      amountKobo: Math.round(totalAmount * 100),
      reference,
      callbackUrl: `${origin}/order/confirmation?reference=${reference}`,
      subaccounts: Array.from(vendorShares.entries()).map(([subaccount, share]) => ({
        subaccount,
        share: Math.round(share * 100),
      })),
      metadata: { order_id: order.id },
    });

    await admin.from("orders").update({ paystack_reference: reference }).eq("id", order.id);

    return NextResponse.json({ authorizationUrl: transaction.authorization_url });
  } catch (err: any) {
    return NextResponse.json({ error: `Payment initialization failed: ${err.message}` }, { status: 502 });
  }
}