import "server-only";

import {z} from "zod";

import {GALLERY_MAX_FILE_BYTES} from "@entities/photo";

export const galleryConfirmPayloadSchema = z
    .object({
        key: z.string().min(1).startsWith("photos/"),
        /** Ignored when a guest session is present — server uses `rsvp.name`. */
        uploaderName: z.string().trim().min(1).max(100).optional(),
        sizeBytes: z
            .number()
            .int()
            .nonnegative()
            .max(GALLERY_MAX_FILE_BYTES)
            .optional(),
        purpose: z.enum(["gallery", "wish"]).optional().default("gallery"),
    })
    .strict();

export type GalleryConfirmPayload = z.infer<typeof galleryConfirmPayloadSchema>;

export function parseGalleryConfirmPayload(
    raw: unknown,
):
    | { ok: true; data: GalleryConfirmPayload }
    | { ok: false; error: z.ZodError } {
    const result = galleryConfirmPayloadSchema.safeParse(raw);
    if (!result.success) {
        return {ok: false, error: result.error};
    }
    return {ok: true, data: result.data};
}
