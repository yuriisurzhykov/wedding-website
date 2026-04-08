import "server-only";

/**
 * Absolute public site URL for transactional emails (CTA links).
 * Prefers `NEXT_PUBLIC_SITE_URL`; on Vercel falls back to `https://${VERCEL_URL}`.
 */
export function getPublicSiteUrl(): string | undefined {
    const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (explicit) {
        return explicit.replace(/\/+$/, "");
    }
    const vercel = process.env.VERCEL_URL?.trim();
    if (!vercel) {
        return undefined;
    }
    const host = vercel.replace(/^\/+/, "").replace(/\/+$/, "");
    if (host.startsWith("http://") || host.startsWith("https://")) {
        return host.replace(/\/+$/, "");
    }
    return `https://${host}`;
}
