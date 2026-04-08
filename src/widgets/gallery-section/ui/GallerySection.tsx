import {getTranslations} from "next-intl/server";

import {Section, SectionHeader} from "@shared/ui";

import {listGalleryPhotos} from "@features/gallery-list";

import {GalleryPhotosClient} from "./GalleryPhotosClient";

/**
 * Gallery block: server-loaded initial list, client handles upload refresh + lightbox.
 */
export async function GallerySection() {
    const t = await getTranslations("gallery");
    const result = await listGalleryPhotos(48);
    const initialPhotos = result.ok ? result.photos : [];

    if (!result.ok) {
        console.error("[GallerySection] listGalleryPhotos", result.kind, result.message);
    }

    return (
        <Section id="gallery" theme="alt">
            <div className="mx-auto max-w-[var(--content-width)]">
                <SectionHeader title={t("title")} subtitle={t("subtitle")}/>
                <GalleryPhotosClient initialPhotos={initialPhotos}/>
            </div>
        </Section>
    );
}
