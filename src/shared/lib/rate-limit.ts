/**
 * In-memory sliding-window IP rate limiter for public API routes.
 *
 * Each route should hold its own limiter instance (module-level singleton)
 * so windows are tracked independently per route.
 *
 * Designed for Vercel serverless: memory is per-instance, which provides a
 * natural per-instance limit that is still effective against abuse. Do NOT
 * use this for admin routes -- those use the DB-backed rate limiter in
 * `@features/admin-api/lib/admin-rate-limit` which persists across instances.
 *
 * Periodic cleanup runs on every check to evict expired buckets, so the Map
 * never grows beyond (live IPs × 1 entry per window).
 */

export interface RateLimitOptions {
    /** Maximum number of requests allowed within `windowMs`. */
    maxRequests: number;
    /** Length of the sliding window in milliseconds. */
    windowMs: number;
}

export interface RateLimitResult {
    allowed: boolean;
    /** Milliseconds until the oldest request in the window expires. 0 when allowed with headroom. */
    retryAfterMs: number;
}

interface Bucket {
    /** Timestamps (ms) of requests within the current window, oldest first. */
    hits: number[];
    /** Expiry of the entire bucket for cleanup purposes. */
    expiresAt: number;
}

export class IpRateLimiter {
    private readonly buckets = new Map<string, Bucket>();

    constructor(private readonly options: RateLimitOptions) {}

    check(ip: string): RateLimitResult {
        const now = Date.now();
        const { maxRequests, windowMs } = this.options;
        const windowStart = now - windowMs;

        this.evictExpired(now);

        const bucket = this.buckets.get(ip) ?? { hits: [], expiresAt: 0 };

        // Drop hits that have fallen outside the sliding window.
        bucket.hits = bucket.hits.filter((t) => t > windowStart);

        if (bucket.hits.length >= maxRequests) {
            // Oldest hit defines when a slot opens up.
            const retryAfterMs = bucket.hits[0]! + windowMs - now;
            bucket.expiresAt = now + windowMs;
            this.buckets.set(ip, bucket);
            return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
        }

        bucket.hits.push(now);
        bucket.expiresAt = now + windowMs;
        this.buckets.set(ip, bucket);
        return { allowed: true, retryAfterMs: 0 };
    }

    private evictExpired(now: number): void {
        for (const [ip, bucket] of this.buckets) {
            if (bucket.expiresAt <= now) {
                this.buckets.delete(ip);
            }
        }
    }
}

/**
 * Extracts the real client IP from a Next.js `Request`.
 *
 * Prefers `x-forwarded-for` (set by Vercel / CDNs) over the raw `host`.
 * Falls back to `"unknown"` so that rate limiting still applies conservatively
 * rather than bypassing entirely when the header is absent.
 */
export function getClientIp(request: Request): string {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
        // `x-forwarded-for` may be a comma-separated list; leftmost is the client.
        const first = xff.split(",")[0]?.trim();
        if (first) return first;
    }
    return "unknown";
}

/**
 * Convenience wrapper: creates a one-shot rate-limit check from a `Request`.
 *
 * @example
 * ```ts
 * const limiter = new IpRateLimiter({ maxRequests: 5, windowMs: 15 * 60_000 });
 *
 * export async function POST(request: Request) {
 *   const result = rateLimit(limiter, request);
 *   if (!result.allowed) {
 *     return new Response("Too Many Requests", {
 *       status: 429,
 *       headers: { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) },
 *     });
 *   }
 *   // ... handler logic
 * }
 * ```
 */
export function rateLimit(
    limiter: IpRateLimiter,
    request: Request,
): RateLimitResult {
    return limiter.check(getClientIp(request));
}
