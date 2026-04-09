import "server-only";

import {inferPublicSiteOriginFromRequest} from "./infer-public-site-origin-from-request";

function toHttpsAbsoluteUrl(hostOrUrl: string): string {
    const host = hostOrUrl.replace(/^\/+/, "").replace(/\/+$/, "");
    if (host.startsWith("http://") || host.startsWith("https://")) {
        return host.replace(/\/+$/, "");
    }
    return `https://${host}`;
}

/**
 * Absolute public site URL for transactional emails (CTA links).
 *
 * Order: `NEXT_PUBLIC_SITE_URL`, then Vercel `VERCEL_PROJECT_PRODUCTION_URL` (production
 * hostname; prefers the shortest custom domain), then `VERCEL_URL` as a last resort.
 *
 * `VERCEL_URL` alone points at the deployment host (`*.vercel.app`), so it is not used when
 * `VERCEL_PROJECT_PRODUCTION_URL` is set.
 */
export function getPublicSiteUrl(): string | undefined {
    const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (explicit) {
        return explicit.replace(/\/+$/, "");
    }
    const vercelHost =
        process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ??
        process.env.VERCEL_URL?.trim();
    if (!vercelHost) {
        return undefined;
    }
    return toHttpsAbsoluteUrl(vercelHost);
}

/**
 * Base URL for links generated during a request (RSVP email, magic link).
 *
 * Order: {@link getPublicSiteUrl} (env / Vercel), then {@link inferPublicSiteOriginFromRequest} when `request` is set.
 * Production should still set `NEXT_PUBLIC_SITE_URL` so links match the canonical domain.
 */
export function resolvePublicSiteBaseForServerEmail(
    request?: Request,
): string | undefined {
    const fromEnv = getPublicSiteUrl();
    if (fromEnv) {
        return fromEnv;
    }
    if (request) {
        return inferPublicSiteOriginFromRequest(request);
    }
    return undefined;
}
