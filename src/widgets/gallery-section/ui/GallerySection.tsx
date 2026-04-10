import {Suspense} from "react";

import {getTranslations} from "next-intl/server";

import {cn} from "@shared/lib/cn";
import {isCelebrationLive} from "@shared/lib/wedding-calendar";
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
    const celebrationLive = isCelebrationLive(new Date());

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
                            celebrationLive={celebrationLive}
                        />
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
