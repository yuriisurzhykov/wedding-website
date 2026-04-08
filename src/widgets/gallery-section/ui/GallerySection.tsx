import {getTranslations} from "next-intl/server";

import {cn} from "@shared/lib/cn";
import {Section, SectionHeader} from "@shared/ui";

import {listGalleryPhotos} from "@features/gallery-list";

import {galleryListLimitForPresentation, type GalleryPresentation,} from "../lib/gallery-presentation";
import {GalleryPhotosClient, type GalleryPhotosClientSlots,} from "./GalleryPhotosClient";

export type {GalleryPresentation};

export type GallerySectionOptions = {
    /** Optional class names for regions inside the client island. */
    slots?: GalleryPhotosClientSlots;
};

type GallerySectionProps = {
    /** Home preview vs full gallery page; drives list limits inside the slice. */
    presentation?: GalleryPresentation;
    /** Merged into the root `Section` (padding/background wrapper). */
    className?: string;
    /** Merged into the inner content column (`max-w` + header + island). */
    contentClassName?: string;
    options?: GallerySectionOptions;
};

/**
 * Gallery block: server-loaded initial list, client handles upload refresh + lightbox.
 */
export async function GallerySection(
    {
        presentation = "preview",
        className,
        contentClassName,
        options,
    }: GallerySectionProps = {}
) {
    const t = await getTranslations("gallery");
    const limit = galleryListLimitForPresentation(presentation);
    const result = await listGalleryPhotos({limit, offset: 0});
    const initialPhotos = result.ok ? result.photos : [];
    const initialHasMore = result.ok ? result.hasMore : false;

    if (!result.ok) {
        console.error("[GallerySection] listGalleryPhotos", result.kind, result.message);
    }

    return (
        <Section id="gallery" theme="alt" className={className}>
            <div
                className={cn(
                    "mx-auto max-w-(--content-width)",
                    contentClassName,
                )}
            >
                <SectionHeader title={t("title")} subtitle={t("subtitle")}/>
                <GalleryPhotosClient
                    initialPhotos={initialPhotos}
                    initialHasMore={initialHasMore}
                    presentation={presentation}
                    slots={options?.slots}
                />
            </div>
        </Section>
    );
}
