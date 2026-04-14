import "server-only";

import {z} from "zod";

const rehomeBodySchema = z
    .object({
        name: z.string().trim().min(1, "Name is required").max(200),
        email: z.string().trim().max(320).pipe(z.email()),
        locale: z.enum(["en", "ru"]).optional().default("en"),
    })
    .strict();

export type ParseGuestCompanionRehomeBodyResult =
    | { ok: true; name: string; email: string; locale: "en" | "ru" }
    | { ok: false; error: z.ZodError };

/**
 * Parses `POST /api/guest/account/email` JSON: companion display name, new mailbox, optional email locale.
 */
export function parseGuestCompanionRehomeBody(raw: unknown): ParseGuestCompanionRehomeBodyResult {
    const result = rehomeBodySchema.safeParse(raw);
    if (!result.success) {
        return {ok: false, error: result.error};
    }
    return {ok: true, ...result.data};
}
