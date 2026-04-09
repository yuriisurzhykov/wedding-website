import "server-only";

import {z} from "zod";

/**
 * `authorName` is optional when a valid guest session cookie is present — the server
 * uses `rsvp.name` (same rules as gallery confirm). Otherwise it is required.
 */
export const wishSubmitPayloadSchema = z
    .object({
        authorName: z.string().trim().max(100).optional(),
        message: z.string().trim().min(1).max(2000),
        photoR2Key: z
            .string()
            .min(1)
            .startsWith("photos/")
            .optional(),
    })
    .strict();

export type WishSubmitPayload = z.infer<typeof wishSubmitPayloadSchema>;

export function parseWishSubmitPayload(
    raw: unknown,
):
    | {ok: true; data: WishSubmitPayload}
    | {ok: false; error: z.ZodError} {
    const result = wishSubmitPayloadSchema.safeParse(raw);
    if (!result.success) {
        return {ok: false, error: result.error};
    }
    return {ok: true, data: result.data};
}
