import {listGalleryPhotosCached} from "@features/gallery-list";

import {
    galleryListLimitForPresentation,
    type GalleryPresentation,
} from "../lib/gallery-presentation";
import {
    GalleryPhotosClient,
    type GalleryPhotosClientSlots,
} from "./GalleryPhotosClient";

export type {GalleryPhotosClientSlots};

type Props = {
    presentation: GalleryPresentation;
    slots?: GalleryPhotosClientSlots;
};

/**
 * Async server child: loads initial gallery rows then hydrates the client island.
 */
export async function GallerySectionPhotosIsland({presentation, slots}: Props) {
    const limit = galleryListLimitForPresentation(presentation);
    const result = await listGalleryPhotosCached({limit, offset: 0});
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
            slots={slots}
        />
    );
}
