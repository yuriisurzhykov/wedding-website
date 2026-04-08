import {getTranslations} from "next-intl/server";

import {PhotoUploader, Section, SectionHeader} from "@shared/ui";

import {listGalleryPhotos} from "@features/gallery-list";

import {GalleryPhotoGrid} from "./GalleryPhotoGrid";

/**
 * Gallery block: recent photos from DB, uploader, and grid.
 */
export async function GallerySection() {
    const t = await getTranslations("gallery");
    const result = await listGalleryPhotos(48);
    const photos = result.ok ? result.photos : [];

    if (!result.ok) {
        console.error("[GallerySection] listGalleryPhotos", result.kind, result.message);
    }

    return (
        <Section id="gallery" theme="alt">
            <div className="mx-auto max-w-[var(--content-width)]">
                <SectionHeader title={t("title")} subtitle={t("subtitle")}/>
                <PhotoUploader/>
                {photos.length === 0 ? (
                    <p className="mt-10 text-center text-body text-text-secondary">
                        {t("empty")}
                    </p>
                ) : (
                    <GalleryPhotoGrid photos={photos}/>
                )}
            </div>
        </Section>
    );
}
