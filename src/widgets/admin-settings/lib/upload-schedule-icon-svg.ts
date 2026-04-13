import {SCHEDULE_ICON_SVG_UPLOAD_MAX_BYTES} from '@entities/wedding-schedule'

export type UploadScheduleIconSvgToR2Result =
    | {ok: true; publicUrl: string}
    | {ok: false; code: 'invalid_file' | 'presign' | 'r2_put' | 'unauthorized' | 'unknown'}

function isLikelySvgFile(file: File): boolean {
    const nameOk = file.name.toLowerCase().endsWith('.svg')
    const type = file.type
    const typeOk =
        type === '' ||
        type === 'image/svg+xml' ||
        type === 'text/xml' ||
        type === 'application/svg+xml'
    return nameOk && typeOk
}

/**
 * Presigns an admin-only PUT to R2, uploads bytes, returns the public object URL for `schedule_items.icon_url`.
 */
export async function uploadScheduleIconSvgToR2(file: File): Promise<UploadScheduleIconSvgToR2Result> {
    if (!isLikelySvgFile(file) || file.size <= 0 || file.size > SCHEDULE_ICON_SVG_UPLOAD_MAX_BYTES) {
        return {ok: false, code: 'invalid_file'}
    }

    const presignRes = await fetch('/api/admin/schedule-icon/presign', {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({size: file.size}),
    })

    if (presignRes.status === 401) {
        return {ok: false, code: 'unauthorized'}
    }

    if (!presignRes.ok) {
        return {ok: false, code: 'presign'}
    }

    const raw: unknown = await presignRes.json().catch(() => null)
    const url =
        typeof raw === 'object' &&
        raw !== null &&
        'url' in raw &&
        typeof (raw as {url: unknown}).url === 'string'
            ? (raw as {url: string}).url
            : null
    const publicUrl =
        typeof raw === 'object' &&
        raw !== null &&
        'publicUrl' in raw &&
        typeof (raw as {publicUrl: unknown}).publicUrl === 'string'
            ? (raw as {publicUrl: string}).publicUrl
            : null

    if (!url || !publicUrl) {
        return {ok: false, code: 'presign'}
    }

    const putRes = await fetch(url, {
        method: 'PUT',
        headers: {'Content-Type': 'image/svg+xml'},
        body: file,
    })

    if (!putRes.ok) {
        return {ok: false, code: 'r2_put'}
    }

    return {ok: true, publicUrl}
}
