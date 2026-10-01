import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client, for use in client components
 * (forms, anything running in the user's browser).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}