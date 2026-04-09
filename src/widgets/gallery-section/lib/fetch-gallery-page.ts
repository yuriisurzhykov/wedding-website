import type {GalleryPhotoView} from '@entities/photo'

export type GalleryPhotosPage = {
    photos: GalleryPhotoView[]
    hasMore: boolean
}

export async function fetchGalleryPhotosPage(
    offset: number,
    limit: number,
): Promise<GalleryPhotosPage | null> {
    const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
    })
    const res = await fetch(`/api/gallery/photos?${params}`, {
        cache: 'no-store',
        credentials: 'same-origin',
    })
    if (!res.ok) {
        return null
    }
    const data = (await res.json()) as {
        photos?: GalleryPhotoView[]
        hasMore?: boolean
    }
    const photos = (data.photos ?? []).map((p) => ({
        ...p,
        canDelete: Boolean(p.canDelete),
    }))
    return {
        photos,
        hasMore: Boolean(data.hasMore),
    }
}
