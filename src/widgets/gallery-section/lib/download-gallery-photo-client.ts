export type DownloadGalleryPhotoResult =
    | { ok: true }
    | { ok: false; code: 'too_many_requests' | 'not_found' | 'unknown' }

const FALLBACK_FILENAME = 'wedding-photo'

/** Pull `filename="..."` out of a `Content-Disposition` header, if present. */
function filenameFromContentDisposition(value: string | null): string | null {
    if (!value) {
        return null
    }
    const match = /filename="?([^";]+)"?/i.exec(value)
    return match?.[1]?.trim() || null
}

/**
 * Downloads a gallery photo via the same-origin proxy and saves it through a
 * temporary anchor. Same-origin means the `download` attribute is honored and
 * no R2 CORS config is required.
 */
export async function downloadGalleryPhotoRequest(
    photoId: string,
): Promise<DownloadGalleryPhotoResult> {
    let res: Response
    try {
        res = await fetch(`/api/gallery/photos/${photoId}/download`, {
            credentials: 'same-origin',
        })
    } catch {
        return {ok: false, code: 'unknown'}
    }

    if (res.status === 429) {
        return {ok: false, code: 'too_many_requests'}
    }
    if (res.status === 404) {
        return {ok: false, code: 'not_found'}
    }
    if (!res.ok) {
        return {ok: false, code: 'unknown'}
    }

    const filename =
        filenameFromContentDisposition(res.headers.get('Content-Disposition')) ??
        FALLBACK_FILENAME

    let blob: Blob
    try {
        blob = await res.blob()
    } catch {
        return {ok: false, code: 'unknown'}
    }

    const url = URL.createObjectURL(blob)
    try {
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = filename
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
    } finally {
        URL.revokeObjectURL(url)
    }

    return {ok: true}
}
