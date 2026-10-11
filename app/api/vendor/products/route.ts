import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { deleteStorageImages } from "@/lib/storage";

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
  const title = (formData.get("title") as string)?.trim();
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string, 10);
  const categoryId = (formData.get("categoryId") as string) || null;
  const imageFiles = formData.getAll("images") as File[];

  if (!title || isNaN(price) || isNaN(stock)) {
    return NextResponse.json(
      { error: "title, price and stock are required" },
      { status: 400 }
    );
  }

  const baseSlug = slugify(title);
  if (!baseSlug) {
    return NextResponse.json(
      { error: "Title must contain at least one letter or number" },
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
      await deleteStorageImages(supabase, imageUrls);
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

  // Slugs are unique across the whole store. If another listing (any vendor,
  // including drafts we can't see) already has this slug, the database rejects
  // the insert and we retry with a numeric suffix.
  let product: any = null;
  let lastError: { code?: string; message: string } | null = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    const { data, error } = await supabase
      .from("products")
      .insert({
        vendor_id: vendor.id,
        category_id: categoryId,
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

    if (!error) {
      product = data;
      break;
    }

    lastError = error;
    if (error.code !== "23505") break;
  }

  if (!product) {
    await deleteStorageImages(supabase, imageUrls);
    return NextResponse.json(
      { error: lastError?.message ?? "Could not create the product" },
      { status: 400 }
    );
  }

  return NextResponse.json({ product });
}