/** Allowed `Content-Type` values for gallery / wish photo uploads (must match `PhotoUploader`). */
export const GALLERY_ALLOWED_CONTENT_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
] as const;

export type GalleryAllowedContentType = (typeof GALLERY_ALLOWED_CONTENT_TYPES)[number];

export const GALLERY_MAX_FILE_BYTES = 5 * 1024 * 1024;
