import { createServerClient } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client that respects the signed-in user's session
 * and therefore respects RLS. Use this in route handlers / server
 * components for anything a normal user or vendor does.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component with no writable cookies - safe to ignore
          }
        },
      },
    }
  );
}

/**
 * Service-role Supabase client. Bypasses RLS entirely.
 * NEVER expose this to the client. Only use inside route handlers,
 * after you've verified the caller is authorized to do the action
 * (e.g. checked profiles.role === 'admin', or this is a Paystack webhook).
 */
export function createServiceRoleClient() {
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}