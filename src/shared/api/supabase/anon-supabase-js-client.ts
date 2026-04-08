import {createClient} from '@supabase/supabase-js'

/**
 * Browser-oriented client using the publishable (anon) key via `supabase-js` directly.
 * Respects RLS. Prefer `@supabase/ssr` helpers when you need cookie-backed sessions.
 */
export function createBrowserClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL or anon/publishable key',
        )
    }
    return createClient(url, key)
}
