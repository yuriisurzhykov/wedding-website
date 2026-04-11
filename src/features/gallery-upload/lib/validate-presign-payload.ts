import "server-only";

import {z} from "zod";

import {GALLERY_ALLOWED_CONTENT_TYPES, GALLERY_MAX_FILE_BYTES,} from "@entities/photo";

const contentTypeEnum = z.enum(GALLERY_ALLOWED_CONTENT_TYPES);

export const galleryPresignPayloadSchema = z
    .object({
        contentType: contentTypeEnum,
        size: z
            .number()
            .int()
            .positive()
            .max(GALLERY_MAX_FILE_BYTES, "File too large"),
        /** `gallery` — shared album; `wish` — attachment to a wish. */
        purpose: z.enum(["gallery", "wish"]).optional().default("gallery"),
    })
    .strict();

export type GalleryPresignPayload = z.infer<typeof galleryPresignPayloadSchema>;

export function parseGalleryPresignPayload(
    raw: unknown,
):
    | { ok: true; data: GalleryPresignPayload }
    | { ok: false; error: z.ZodError } {
    const result = galleryPresignPayloadSchema.safeParse(raw);
    if (!result.success) {
        return {ok: false, error: result.error};
    }
    return {ok: true, data: result.data};
}
