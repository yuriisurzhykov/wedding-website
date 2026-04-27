import type {GalleryPhotoView} from '@entities/photo'

export type GalleryPhotosPage = {
    photos: GalleryPhotoView[]
    hasMore: boolean
}

export type GalleryPhotosPageResult =
    | (GalleryPhotosPage & { status: 'ok' })
    | { status: 'rate_limited' }
    | { status: 'error' }

export async function fetchGalleryPhotosPage(
    offset: number,
    limit: number,
): Promise<GalleryPhotosPageResult> {
    let res: Response
    try {
        const params = new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
        })
        res = await fetch(`/api/gallery/photos?${params}`, {
            cache: 'no-store',
            credentials: 'same-origin',
        })
    } catch {
        return {status: 'error'}
    }
    if (res.status === 429) return {status: 'rate_limited'}
    if (!res.ok) return {status: 'error'}
    const data = (await res.json()) as {
        photos?: GalleryPhotoView[]
        hasMore?: boolean
    }
    const photos = (data.photos ?? []).map((p) => ({
        ...p,
        canDelete: Boolean(p.canDelete),
    }))
    return {
        status: 'ok',
        photos,
        hasMore: Boolean(data.hasMore),
    }
}
