import "server-only";

import {createServerClient} from "@shared/api/supabase/service-role-client";

/**
 * Loads the bcrypt hash for admin login from `admin_site_credential` (service_role only).
 *
 * @returns `null` if no row exists (run `npm run admin:set-password`).
 * @throws On Supabase misconfiguration or query failure.
 */
export async function fetchAdminPasswordHashFromDatabase(): Promise<string | null> {
    const supabase = createServerClient();
    const {data, error} = await supabase
        .from("admin_site_credential")
        .select("password_hash")
        .eq("id", 1)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }
    const h = data?.password_hash?.trim();
    if (!h) {
        return null;
    }
    return h;
}
