import "server-only";

import {z} from "zod";

export const galleryConfirmPayloadSchema = z
    .object({
        key: z.string().min(1).startsWith("photos/"),
        uploaderName: z.string().trim().min(1).max(100),
        sizeBytes: z.number().int().nonnegative().optional(),
    })
    .strict();

export type GalleryConfirmPayload = z.infer<typeof galleryConfirmPayloadSchema>;

export function parseGalleryConfirmPayload(
    raw: unknown,
):
    | {ok: true; data: GalleryConfirmPayload}
    | {ok: false; error: z.ZodError} {
    const result = galleryConfirmPayloadSchema.safeParse(raw);
    if (!result.success) {
        return {ok: false, error: result.error};
    }
    return {ok: true, data: result.data};
}
