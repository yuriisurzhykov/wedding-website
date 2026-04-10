import type {GuestSessionPublicErrorCode} from '@features/guest-session'

export type DeleteGalleryPhotoClientResult =
    | { ok: true }
    | { ok: false; code: GuestSessionPublicErrorCode | 'validation' | 'unknown' }

/**
 * Calls `DELETE /api/gallery/photos` with the guest session cookie.
 */
export async function deleteGalleryPhotoRequest(
    photoId: string,
): Promise<DeleteGalleryPhotoClientResult> {
    let res: Response
    try {
        res = await fetch('/api/gallery/photos', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            credentials: 'same-origin',
            body: JSON.stringify({photoId}),
        })
    } catch {
        return {ok: false, code: 'request_failed'}
    }

    if (res.ok) {
        return {ok: true}
    }

    let body: unknown
    try {
        body = await res.json()
    } catch {
        return {ok: false, code: 'unknown'}
    }

    if (
        body &&
        typeof body === 'object' &&
        'error' in body &&
        body.error &&
        typeof body.error === 'object' &&
        'code' in body.error &&
        typeof (body.error as { code: unknown }).code === 'string'
    ) {
        return {
            ok: false,
            code: (body.error as { code: GuestSessionPublicErrorCode }).code,
        }
    }

    return {ok: false, code: 'unknown'}
}
