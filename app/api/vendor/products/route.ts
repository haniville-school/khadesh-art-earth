import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getOwnVendor(supabase: any, userId: string) {
  const { data } = await supabase
    .from("vendors")
    .select("id, status")
    .eq("profile_id", userId)
    .single();
  return data;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const vendor = await getOwnVendor(supabase, user.id);
  if (!vendor) {
    return NextResponse.json({ error: "You don't have a vendor account yet" }, { status: 403 });
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const vendor = await getOwnVendor(supabase, user.id);
  if (!vendor) {
    return NextResponse.json({ error: "You don't have a vendor account yet" }, { status: 403 });
  }

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string, 10);
  const imageFiles = formData.getAll("images") as File[];

  if (!title || !slug || isNaN(price) || isNaN(stock)) {
    return NextResponse.json(
      { error: "title, slug, price and stock are required" },
      { status: 400 }
    );
  }

  const imageUrls: string[] = [];
  for (const file of imageFiles) {
    if (!file || file.size === 0) continue;

    const ext = file.name.split(".").pop();
    const path = `${vendor.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file);

    if (uploadError) {
      return NextResponse.json(
        { error: `Image upload failed: ${uploadError.message}` },
        { status: 400 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(path);

    imageUrls.push(publicUrlData.publicUrl);
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      vendor_id: vendor.id,
      title,
      slug,
      description,
      price,
      stock,
      images: imageUrls,
      status: "published",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ product });
}