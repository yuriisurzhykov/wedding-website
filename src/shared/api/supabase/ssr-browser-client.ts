import {createBrowserClient} from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

/** Browser client using `@supabase/ssr` (cookie/session aware). */
export function createSupabaseSsrBrowserClient() {
    return createBrowserClient(supabaseUrl!, supabaseKey!)
}
