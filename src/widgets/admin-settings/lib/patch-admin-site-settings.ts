import type {PublicContact, SiteSettingsPatch} from '@entities/site-settings'

export type AdminSiteSettingsPatchResult =
    | {ok: true; updated_at?: string; public_contact?: PublicContact}
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

    let public_contact: PublicContact | undefined
    if (
        typeof data === 'object' &&
        data !== null &&
        'public_contact' in data &&
        typeof (data as {public_contact: unknown}).public_contact === 'object' &&
        (data as {public_contact: unknown}).public_contact !== null
    ) {
        const pc = (data as {public_contact: {phone?: unknown; email?: unknown}}).public_contact
        if (typeof pc.phone === 'string' && typeof pc.email === 'string') {
            public_contact = {phone: pc.phone, email: pc.email}
        }
    }

    return {ok: true, updated_at, public_contact}
}
