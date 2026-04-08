import 'server-only'

import {createServerClient} from '@supabase/ssr'
import {cookies} from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

/**
 * Supabase client for Server Components / server actions with cookie read/write.
 * @param cookieStore — result of `await cookies()` in Next.js App Router
 */
export function createSupabaseCookieClient(
    cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
    return createServerClient(supabaseUrl!, supabaseKey!, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({name, value, options}) =>
                        cookieStore.set(name, value, options),
                    )
                } catch {
                    // Called from a Server Component where `set` is not allowed; middleware may refresh session.
                }
            },
        },
    })
}
