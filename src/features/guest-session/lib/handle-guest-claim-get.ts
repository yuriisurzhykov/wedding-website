import "server-only";

import {NextResponse} from "next/server";

import {buildGuestSessionErrorJson, httpStatusForGuestSessionErrorCode,} from "@features/guest-session";
import {createServerClient} from "@shared/api/supabase/server";
import {getPublicSiteUrl} from "@shared/lib/get-public-site-url";
import {pathForLocale, toAbsoluteUrl} from "@shared/lib/i18n/locale-path";

import type {ClaimMagicLinkResult} from "./claim-magic-link";
import {claimMagicLink} from "./claim-magic-link";
import {getGuestSessionCookieDescriptor} from "./cookie";
import {getGuestSessionRuntimeConfig} from "./get-guest-session-config";

export type GuestClaimLocale = "en" | "ru";

/**
 * Reads `token` and `locale` from a claim URL (`GET /api/guest/claim`).
 */
export function parseGuestClaimSearchParams(url: URL): {
    rawToken: string | null;
    locale: GuestClaimLocale;
} {
    return {
        rawToken: url.searchParams.get("token"),
        locale: url.searchParams.get("locale") === "ru" ? "ru" : "en",
    };
}

/**
 * Maps a failed {@link claimMagicLink} outcome to the `error` query value on the localized claim page.
 */
export function mapClaimFailureToGuestClaimErrorQuery(
    result: Extract<ClaimMagicLinkResult, { ok: false }>,
): "magic_link_invalid" | "server_error" {
    if (result.kind === "database" || result.kind === "session_failed") {
        return "server_error";
    }
    return "magic_link_invalid";
}

/**
 * Builds the **302** response for `GET /api/guest/claim` (redirect + optional cookie).
 */
export async function handleGuestClaimGet(request: Request): Promise<NextResponse> {
    const url = new URL(request.url);
    const {rawToken, locale} = parseGuestClaimSearchParams(url);

    const siteUrl = getPublicSiteUrl();
    if (!siteUrl) {
        return NextResponse.json(buildGuestSessionErrorJson("server_error"), {
            status: httpStatusForGuestSessionErrorCode("server_error"),
        });
    }

    const base = siteUrl.replace(/\/+$/, "");

    const redirectToClaimPageWithError = (
        code: "magic_link_invalid" | "server_error",
    ) => {
        const path = pathForLocale(locale, "/guest/claim");
        const target = `${toAbsoluteUrl(base, path)}?error=${code}`;
        return NextResponse.redirect(target);
    };

    if (!rawToken?.trim()) {
        return redirectToClaimPageWithError("magic_link_invalid");
    }

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        console.error("[api/guest/claim] config", e);
        return NextResponse.json(buildGuestSessionErrorJson("server_error"), {
            status: httpStatusForGuestSessionErrorCode("server_error"),
        });
    }

    const result = await claimMagicLink(supabase, rawToken);

    if (!result.ok) {
        if (result.kind === "database" || result.kind === "session_failed") {
            if (result.message) {
                console.error(
                    `[api/guest/claim] ${result.kind}: ${result.message}`,
                );
            }
        }
        return redirectToClaimPageWithError(
            mapClaimFailureToGuestClaimErrorQuery(result),
        );
    }

    const homePath = pathForLocale(locale, "");
    const successUrl = toAbsoluteUrl(base, homePath === "" ? "/" : homePath);

    const res = NextResponse.redirect(successUrl, 302);
    const desc = getGuestSessionCookieDescriptor(
        result.rawToken,
        getGuestSessionRuntimeConfig(),
    );
    res.cookies.set(desc.name, desc.value, desc.options);
    return res;
}
