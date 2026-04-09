import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

import {createGuestMagicLinkToken} from "@features/guest-session/server";
import type {GuestEmailLocale} from "./email/guest-confirmation-copy";

/**
 * Builds the absolute **`GET /api/guest/claim`** URL with `token` and `locale` query params.
 * Pure string composition (no I/O).
 */
export function buildGuestMagicLinkClaimAbsoluteUrl(
    siteBaseUrl: string,
    rawToken: string,
    locale: GuestEmailLocale,
): string {
    const base = siteBaseUrl.replace(/\/+$/, "");
    const params = new URLSearchParams({
        token: rawToken,
        locale,
    });
    return `${base}/api/guest/claim?${params.toString()}`;
}

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
    const created = await createGuestMagicLinkToken(supabase, rsvpId);
    if (!created.ok) {
        console.error(`[rsvp-submit] magic link token: ${created.message}`);
        return undefined;
    }

    if (!siteBase?.trim()) {
        console.warn(
            "[rsvp-submit] Magic link token saved but no public site base for email URL (set NEXT_PUBLIC_SITE_URL or POST RSVP from the browser).",
        );
        return undefined;
    }

    return buildGuestMagicLinkClaimAbsoluteUrl(
        siteBase.trim().replace(/\/+$/, ""),
        created.rawToken,
        locale,
    );
}
