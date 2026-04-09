import {z} from "zod";

const deleteGalleryPhotoPayloadSchema = z.object({
    photoId: z.string().uuid(),
});

export type DeleteGalleryPhotoPayload = z.infer<
    typeof deleteGalleryPhotoPayloadSchema
>;

export function parseDeleteGalleryPhotoPayload(raw: unknown) {
    return deleteGalleryPhotoPayloadSchema.safeParse(raw);
}
