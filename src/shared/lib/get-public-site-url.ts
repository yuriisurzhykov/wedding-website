import "server-only";

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
