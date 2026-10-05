import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deleteStorageImages } from "@/lib/storage";

export async function POST(
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

  const { data: product } = await supabase
    .from("products")
    .select("id, images, vendor_id")
    .eq("id", id)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const files = formData.getAll("images") as File[];

  const newUrls: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;

    const ext = file.name.split(".").pop();
    const path = `${product.vendor_id}/${crypto.randomUUID()}.${ext}`;

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

    newUrls.push(publicUrlData.publicUrl);
  }

  const updatedImages = [...(product.images ?? []), ...newUrls];

  const { data: updated, error } = await supabase
    .from("products")
    .update({ images: updatedImages })
    .eq("id", id)
    .select("images")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ images: updated.images });
}

export async function DELETE(
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

  const { imageUrl } = await req.json();

  const { data: product } = await supabase
    .from("products")
    .select("images")
    .eq("id", id)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const updatedImages = (product.images ?? []).filter((url: string) => url !== imageUrl);

  const { data: updated, error } = await supabase
    .from("products")
    .update({ images: updatedImages })
    .eq("id", id)
    .select("images")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await deleteStorageImages(supabase, [imageUrl]);

  return NextResponse.json({ images: updated.images });
}

export async function PUT(
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

  const { images } = await req.json();

  const { data: updated, error } = await supabase
    .from("products")
    .update({ images })
    .eq("id", id)
    .select("images")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ images: updated.images });
}