import {getSiteSettingsCached} from '@features/site-settings'
import {NextResponse} from 'next/server'

/**
 * Public capabilities snapshot for long-lived guest tabs. Align cache behavior with `getSiteSettingsCached` + tag
 * `site-settings` (see `@features/site-settings` README).
 */
export async function GET() {
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
                    'Cache-Control': 'private, no-cache, must-revalidate',
                },
            },
        )
    } catch {
        return NextResponse.json({ok: false as const}, {status: 500})
    }
}
