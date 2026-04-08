import {Suspense} from "react";

import {getTranslations} from "next-intl/server";

import {cn} from "@shared/lib/cn";
import {Section, SectionHeader} from "@shared/ui";

import {type GalleryPresentation} from "../lib/gallery-presentation";
import {GalleryPhotosStreamFallback} from "./GalleryPhotosStreamFallback";
import {
    GallerySectionPhotosIsland,
    type GalleryPhotosClientSlots,
} from "./GallerySectionPhotosIsland";

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

    return (
        <Section id="gallery" theme="alt" className={className}>
            <div
                className={cn(
                    "mx-auto max-w-(--content-width)",
                    contentClassName,
                )}
            >
                <SectionHeader title={t("title")} subtitle={t("subtitle")}/>
                <Suspense
                    fallback={
                        <GalleryPhotosStreamFallback presentation={presentation}/>
                    }
                >
                    <GallerySectionPhotosIsland
                        presentation={presentation}
                        slots={options?.slots}
                    />
                </Suspense>
            </div>
        </Section>
    );
}
