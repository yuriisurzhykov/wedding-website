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
 * Absolute public site URL for transactional emails (CTA links), sitemap, and robots.
 *
 * **Priority (first match wins):**
 *
 * 1. **`NEXT_PUBLIC_SITE_URL`** — explicit canonical base when you need a fixed hostname in
 *    links (e.g. custom domain, stable `www` vs apex). Optional on Vercel if the Vercel chain
 *    below already yields the URL you want.
 * 2. **`VERCEL_PROJECT_PRODUCTION_URL`** — set by Vercel on deployments; production hostname
 *    (often the primary custom domain when configured).
 * 3. **`VERCEL_URL`** — set by Vercel for the current deployment (preview or `*.vercel.app`);
 *    used only when `VERCEL_PROJECT_PRODUCTION_URL` is unset.
 *
 * On Vercel, (2) and (3) reflect the platform environment without extra configuration; use (1)
 * when you must override that with a specific canonical URL.
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
 * Base URL for links generated during a request (RSVP confirmation, magic link, guest flows).
 *
 * **Priority:**
 *
 * 1. {@link getPublicSiteUrl} — `NEXT_PUBLIC_SITE_URL` or Vercel `VERCEL_*` (see there).
 * 2. If that returns `undefined` and `request` is provided — {@link inferPublicSiteOriginFromRequest}
 *    (e.g. local dev or tests where env is empty but the incoming `Host` / `x-forwarded-*` headers are set).
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
