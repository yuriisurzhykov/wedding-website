import {getSiteSettingsCached} from '@features/site-settings'
import {NextResponse} from 'next/server'
import {IpRateLimiter, rateLimit} from '@shared/lib'

const limiter = new IpRateLimiter({maxRequests: 30, windowMs: 60_000})

/**
 * Public capabilities snapshot for long-lived guest tabs. Align cache behavior with `getSiteSettingsCached` + tag
 * `site-settings` (see `@features/site-settings` README).
 */
export async function GET(request: Request) {
    const rl = rateLimit(limiter, request)
    if (!rl.allowed) {
        return NextResponse.json(
            {ok: false as const, error: 'too_many_requests'},
            {status: 429, headers: {'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000))}},
        )
    }

    try {
        const settings = await getSiteSettingsCached()
        return NextResponse.json(
            {
                ok: true as const,
                updated_at: settings.updated_at,
                capabilities: settings.capabilities,
                public_contact: settings.public_contact,
            },
            {
                headers: {
                    // Let the browser revalidate; Next data cache + `revalidateTag` own freshness on the server.
                    'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
                },
            },
        )
    } catch {
        return NextResponse.json({ok: false as const}, {status: 500})
    }
}
