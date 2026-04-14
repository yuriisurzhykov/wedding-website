import type {FeatureState} from "@entities/site-settings";
import {getViewerGuestAccountIdFromServerCookies} from "@features/guest-session/server";
import {listGalleryPhotosCached} from "@features/gallery-list";

import {galleryListLimitForPresentation, type GalleryPresentation,} from "../lib/gallery-presentation";
import {GalleryPhotosClient, type GalleryPhotosClientSlots,} from "./GalleryPhotosClient";

export type {GalleryPhotosClientSlots};

type Props = {
    presentation: GalleryPresentation;
    galleryBrowse: FeatureState;
    galleryUpload: FeatureState;
    galleryPhotoDelete: FeatureState;
    slots?: GalleryPhotosClientSlots;
};

/**
 * Async server child: loads initial gallery rows then hydrates the client island.
 */
export async function GallerySectionPhotosIsland({
    presentation,
    galleryBrowse,
    galleryUpload,
    galleryPhotoDelete,
    slots,
}: Props) {
    const limit = galleryListLimitForPresentation(presentation);
    const viewerGuestAccountId = await getViewerGuestAccountIdFromServerCookies();
    const result = await listGalleryPhotosCached({
        limit,
        offset: 0,
        viewerGuestAccountId,
    });
    const initialPhotos = result.ok ? result.photos : [];
    const initialHasMore = result.ok ? result.hasMore : false;

    if (!result.ok) {
        console.error(
            "[GallerySectionPhotosIsland] listGalleryPhotosCached",
            result.kind,
            result.message,
        );
    }

    return (
        <GalleryPhotosClient
            initialPhotos={initialPhotos}
            initialHasMore={initialHasMore}
            presentation={presentation}
            galleryBrowse={galleryBrowse}
            galleryUpload={galleryUpload}
            galleryPhotoDelete={galleryPhotoDelete}
            slots={slots}
        />
    );
}
