import 'server-only'

import {createClient} from '@supabase/supabase-js'

/**
 * Supabase client using the publishable (anon) key — respects RLS. Use for public reads where the service role is not
 * required (e.g. `site_settings` with a public SELECT policy).
 */
export function createPublishableServerClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    if (!url || !key) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL or anon/publishable key for publishable Supabase client',
        )
    }
    return createClient(url, key)
}
