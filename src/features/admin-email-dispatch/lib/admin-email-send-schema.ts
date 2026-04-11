import {z} from "zod";

export const adminEmailSendSchema = z.discriminatedUnion("mode", [
    z.object({
        mode: z.literal("test"),
        template_id: z.string().uuid(),
        test_email: z.string().email(),
        /** Overrides template default; omit to use template `sender_id`, then env default. */
        sender_id: z.string().uuid().optional(),
    }),
    z.object({
        mode: z.literal("broadcast"),
        template_id: z.string().uuid(),
        segment: z.enum(["all", "attending", "not_attending"]),
        sender_id: z.string().uuid().optional(),
    }),
]);

export type AdminEmailSendInput = z.infer<typeof adminEmailSendSchema>;
