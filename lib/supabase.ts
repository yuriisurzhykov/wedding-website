import {createClient} from "@supabase/supabase-js";

/**
 * Server client — uses service_role, bypasses RLS.
 * For API routes and server-only code only.
 */
export function createServerClient() {
    const url =
        process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error(
            "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY",
        );
    }
    return createClient(url, key);
}

/**
 * Browser client — publishable key, respects RLS.
 */
export function createBrowserClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    if (!url || !key) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or anon/publishable key",
        );
    }
    return createClient(url, key);
}
