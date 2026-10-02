import { NextRequest, NextResponse } from "next/server";
import { fulfillOrderByReference } from "@/lib/orders";

export async function POST(req: NextRequest) {
  const { reference } = await req.json();
  if (!reference) {
    return NextResponse.json({ error: "reference is required" }, { status: 400 });
  }

  const result = await fulfillOrderByReference(reference);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  if ("failed" in result && result.failed) {
    return NextResponse.json({ status: "failed", order: result.order });
  }

  return NextResponse.json({ status: "paid", order: result.order });
}