import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

import {
    buildGuestMagicLinkClaimAbsoluteUrl,
    createGuestMagicLinkToken,
    getOrCreatePrimaryGuestAccountId,
} from "@features/guest-session/server";
import type {GuestEmailLocale} from "./email/guest-confirmation-copy";

/**
 * Inserts a magic-link row and returns the full claim URL when `siteBase` is known.
 *
 * `siteBase` should come from {@link resolvePublicSiteBaseForServerEmail} (env, Vercel, or `Host` from the RSVP request).
 * If it is missing, logs a short warning — RSVP still succeeds; the guest email simply omits the magic-link button.
 */
export async function resolveGuestMagicLinkClaimUrl(
    supabase: SupabaseClient,
    rsvpId: string,
    locale: GuestEmailLocale,
    siteBase: string | undefined,
): Promise<string | undefined> {
    const primary = await getOrCreatePrimaryGuestAccountId(supabase, rsvpId);
    if (!primary.ok) {
        console.error(`[rsvp-submit] magic link primary account: ${primary.message}`);
        return undefined;
    }
    const created = await createGuestMagicLinkToken(
        supabase,
        primary.guestAccountId,
    );
    if (!created.ok) {
        console.error(`[rsvp-submit] magic link token: ${created.message}`);
        return undefined;
    }

    if (!siteBase?.trim()) {
        console.warn(
            "[rsvp-submit] Magic link token saved but no public site base for email URL (set NEXT_PUBLIC_SITE_URL, deploy on Vercel with VERCEL_* URLs, or POST RSVP from the browser).",
        );
        return undefined;
    }

    return buildGuestMagicLinkClaimAbsoluteUrl(
        siteBase.trim().replace(/\/+$/, ""),
        created.rawToken,
        locale,
    );
}
