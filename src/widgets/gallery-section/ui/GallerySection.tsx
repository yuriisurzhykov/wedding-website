import {Suspense} from "react";

import {getTranslations} from "next-intl/server";

import {isFeatureEnabled} from "@entities/site-settings";
import {getSiteSettingsCached} from "@features/site-settings";
import {cn} from "@shared/lib/cn";
import {Section, SectionHeader, type SectionTheme} from "@shared/ui";

import {type GalleryPresentation} from "../lib/gallery-presentation";
import {GalleryPhotosStreamFallback} from "./GalleryPhotosStreamFallback";
import {type GalleryPhotosClientSlots, GallerySectionPhotosIsland,} from "./GallerySectionPhotosIsland";

export type {GalleryPresentation};

export type GallerySectionOptions = {
    /** Optional class names for regions inside the client island. */
    slots?: GalleryPhotosClientSlots;
};

type GallerySectionProps = {
    /** Home preview vs full gallery page; drives list limits inside the slice. */
    presentation?: GalleryPresentation;
    /** Background band for the section wrapper (defaults to `alt` for standalone gallery page). */
    theme?: SectionTheme;
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
        theme = "alt",
        className,
        contentClassName,
        options,
    }: GallerySectionProps = {}
) {
    const t = await getTranslations("gallery");
    const siteSettings = await getSiteSettingsCached();
    const galleryBrowse = siteSettings.capabilities.galleryBrowse;
    const galleryUpload = siteSettings.capabilities.galleryUpload;
    const galleryPhotoDelete = siteSettings.capabilities.galleryPhotoDelete;
    const galleryBrowseEnabled = isFeatureEnabled(galleryBrowse);

    return (
        <Section id="gallery" theme={theme} className={className}>
            <div
                className={cn(
                    "mx-auto max-w-(--content-width)",
                    contentClassName,
                )}
            >
                <SectionHeader title={t("title")} subtitle={t("subtitle")}/>
                <Suspense
                    fallback={
                        <GalleryPhotosStreamFallback
                            presentation={presentation}
                            galleryBrowseEnabled={galleryBrowseEnabled}
                        />
                    }
                >
                    <GallerySectionPhotosIsland
                        presentation={presentation}
                        galleryBrowse={galleryBrowse}
                        galleryUpload={galleryUpload}
                        galleryPhotoDelete={galleryPhotoDelete}
                        slots={options?.slots}
                    />
                </Suspense>
            </div>
        </Section>
    );
}
