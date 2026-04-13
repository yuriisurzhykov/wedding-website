import type {WeddingScheduleReplacePayload} from '@entities/wedding-schedule'

export type AdminSchedulePatchResult =
    | {ok: true; updated_at?: string}
    | {ok: false; status: number; data: unknown}

/**
 * Replaces the full wedding schedule via `PATCH /api/admin/schedule`.
 */
export async function patchAdminSchedule(
    payload: WeddingScheduleReplacePayload,
): Promise<AdminSchedulePatchResult> {
    const res = await fetch('/api/admin/schedule', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
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
