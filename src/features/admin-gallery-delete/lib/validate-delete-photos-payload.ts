import {z} from "zod";

const ADMIN_DELETE_PHOTOS_MAX = 100;

const schema = z.object({
    ids: z
        .array(z.string().uuid())
        .min(1, "ids must not be empty")
        .max(ADMIN_DELETE_PHOTOS_MAX),
});

export type DeletePhotosPayload = z.infer<typeof schema>;

/**
 * Parses JSON body for `DELETE /api/admin/photos`.
 */
export function parseDeletePhotosPayload(
    raw: unknown,
):
    | { success: true; data: DeletePhotosPayload }
    | { success: false; error: z.ZodError } {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        return {success: false, error: parsed.error};
    }
    return {success: true, data: parsed.data};
}
