import type {SiteSettingsPatch} from '@entities/site-settings'

export type AdminSiteSettingsPatchResult =
    | {ok: true; updated_at?: string}
    | {ok: false; status: number; data: unknown}

/**
 * Applies a partial update to site settings via the admin API (session cookie or legacy token).
 */
export async function patchAdminSiteSettings(
    patch: SiteSettingsPatch,
): Promise<AdminSiteSettingsPatchResult> {
    const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(patch),
    })

    const data: unknown = await res.json().catch(() => null)

    if (!res.ok) {
        return {ok: false, status: res.status, data}
    }

    let updated_at: string | undefined
    if (
        typeof data === 'object' &&
        data !== null &&
        'updated_at' in data &&
        typeof (data as {updated_at: unknown}).updated_at === 'string'
    ) {
        updated_at = (data as {updated_at: string}).updated_at
    }

    return {ok: true, updated_at}
}
