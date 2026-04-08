import "server-only";

import {unstable_cache} from "next/cache";

import {
    listGalleryPhotos,
    type ListGalleryPhotosOptions,
    type ListGalleryPhotosResult,
} from "./list-gallery-photos";

/** Passed to `revalidateTag` after a new gallery photo is persisted so RSC lists refresh. */
export const GALLERY_PHOTOS_LIST_CACHE_TAG = "gallery-photos-list";

/**
 * Cached read of the public gallery list for RSC (short revalidate + tag invalidation on upload).
 * API routes should keep calling {@link listGalleryPhotos} directly so clients always get fresh pages.
 */
export async function listGalleryPhotosCached(
    options?: ListGalleryPhotosOptions,
): Promise<ListGalleryPhotosResult> {
    const limit = options?.limit ?? 48;
    const offset = options?.offset ?? 0;

    const cachedRead = unstable_cache(
        async () => listGalleryPhotos({limit, offset}),
        ["list-gallery-photos", String(limit), String(offset)],
        {revalidate: 60, tags: [GALLERY_PHOTOS_LIST_CACHE_TAG]},
    );

    return cachedRead();
}
