import "server-only";

import {cookies} from "next/headers";

import {createServerClient} from "@shared/api/supabase/server";

import {getGuestSessionRuntimeConfig} from "./get-guest-session-config";
import {validateGuestSession} from "./validate-session";

/**
 * Resolves the current guest’s `rsvp_id` from the HttpOnly session cookie (RSC / Route Handler).
 * Returns `null` when there is no valid session.
 */
export async function getViewerRsvpIdFromServerCookies(): Promise<string | null> {
    const store = await cookies();
    const token =
        store.get(getGuestSessionRuntimeConfig().cookieName)?.value ?? null;

    let supabase;
    try {
        supabase = createServerClient();
    } catch {
        return null;
    }

    const result = await validateGuestSession(supabase, token);
    return result.ok ? result.session.rsvp_id : null;
}
