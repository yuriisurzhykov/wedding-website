import {handleGuestClaimGet, parseGuestClaimSearchParams} from "@features/guest-session/server";
import {IpRateLimiter, rateLimit} from "@shared/lib";
import {getPublicSiteUrl} from "@shared/lib/get-public-site-url";
import {pathForLocale, toAbsoluteUrl} from "@shared/lib/i18n/locale-path";
import {NextResponse} from "next/server";

const limiter = new IpRateLimiter({maxRequests: 10, windowMs: 15 * 60_000});

/**
 * Delegates to {@link handleGuestClaimGet} — HTTP adapter only.
 */
export async function GET(request: Request) {
    const rl = rateLimit(limiter, request);
    if (!rl.allowed) {
        const siteUrl = getPublicSiteUrl();
        if (siteUrl) {
            const {locale} = parseGuestClaimSearchParams(new URL(request.url));
            const base = siteUrl.replace(/\/+$/, "");
            const path = pathForLocale(locale, "/guest/claim");
            return NextResponse.redirect(
                `${toAbsoluteUrl(base, path)}?error=too_many_requests`,
                302,
            );
        }
        return NextResponse.json(
            {error: "too_many_requests"},
            {status: 429, headers: {"Retry-After": String(Math.ceil(rl.retryAfterMs / 1000))}},
        );
    }

    return handleGuestClaimGet(request);
}
