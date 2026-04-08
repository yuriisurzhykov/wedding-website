import {cn} from "@shared/lib/cn";

import {
    galleryListLimitForPresentation,
    type GalleryPresentation,
} from "../lib/gallery-presentation";

type Props = {
    presentation: GalleryPresentation;
};

/**
 * Skeleton for the gallery client island while the photo list RSC is streaming.
 */
export function GalleryPhotosStreamFallback({presentation}: Props) {
    const gridClass =
        "mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4";
    const cellCount = Math.min(galleryListLimitForPresentation(presentation), 12);

    return (
        <div aria-busy className="w-full">
            <div
                className={cn(
                    "h-11 w-full max-w-xs animate-pulse rounded-md bg-bg-section",
                    "shadow-sm",
                )}
            />
            <ul className={gridClass}>
                {Array.from({length: cellCount}, (_, i) => (
                    <li key={i}>
                        <div
                            className={cn(
                                "aspect-square w-full animate-pulse rounded-card bg-bg-section",
                                "shadow-card",
                            )}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}
