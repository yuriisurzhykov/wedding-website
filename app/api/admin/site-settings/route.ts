import {updateSiteSettings} from '@features/site-settings'
import {NextResponse} from 'next/server'

/**
 * PATCH /api/admin/site-settings
 *
 * Body: JSON matching {@link siteSettingsPatchSchema} (partial capabilities and/or full `schedule_program`).
 * Auth: middleware requires `ADMIN_SECRET` (Authorization Bearer, `x-admin-token`, or `?token=` for navigations).
 */
export async function PATCH(request: Request) {
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({error: 'Invalid JSON body'}, {status: 400})
    }

    const result = await updateSiteSettings(body)
    if (!result.ok) {
        return NextResponse.json({error: result.error}, {status: 400})
    }

    return NextResponse.json({
        ok: true,
        updated_at: result.settings.updated_at,
        capabilities: result.settings.capabilities,
        schedule_program: result.settings.schedule_program,
    })
}
