import {
    GALLERY_PHOTO_LIMIT_FULL,
    GALLERY_PHOTO_LIMIT_PREVIEW,
} from "../config";

export type GalleryPresentation = "preview" | "full";

export function galleryListLimitForPresentation(
    presentation: GalleryPresentation,
): number {
    return presentation === "preview"
        ? GALLERY_PHOTO_LIMIT_PREVIEW
        : GALLERY_PHOTO_LIMIT_FULL;
}
