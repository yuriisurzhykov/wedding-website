import 'server-only'

import {createClient} from '@supabase/supabase-js'

/**
 * Admin Supabase client — uses `service_role`, bypasses RLS.
 * For API routes and other server-only code only.
 */
export function createServerClient() {
    const url =
        process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        throw new Error(
            'Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY',
        )
    }
    return createClient(url, key)
}
