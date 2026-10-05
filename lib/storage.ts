import { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "product-images";

function extractStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

export async function deleteStorageImages(supabase: SupabaseClient, urls: string[]) {
  const paths = urls
    .map(extractStoragePath)
    .filter((p): p is string => p !== null);

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error("Failed to delete storage images:", error.message, paths);
  }
}