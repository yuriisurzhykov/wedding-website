import "server-only";

import {z} from "zod";

export const wishSubmitPayloadSchema = z
    .object({
        authorName: z.string().trim().min(1).max(100),
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
