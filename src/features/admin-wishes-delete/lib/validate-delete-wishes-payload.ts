import {z} from "zod";

const ADMIN_DELETE_WISHES_MAX = 100;

const schema = z.object({
    ids: z
        .array(z.string().uuid())
        .min(1, "ids must not be empty")
        .max(ADMIN_DELETE_WISHES_MAX),
});

export type DeleteWishesPayload = z.infer<typeof schema>;

/**
 * Parses JSON body for `DELETE /api/admin/wishes`.
 */
export function parseDeleteWishesPayload(
    raw: unknown,
):
    | { success: true; data: DeleteWishesPayload }
    | { success: false; error: z.ZodError } {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        return {success: false, error: parsed.error};
    }
    return {success: true, data: parsed.data};
}
