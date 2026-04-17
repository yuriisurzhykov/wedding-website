import {z} from "zod";

export const inboundEmailStatusUpdateSchema = z.enum(["unread", "read", "archived"]);

export type InboundEmailStatusUpdate = z.infer<typeof inboundEmailStatusUpdateSchema>;

/** JSON body for PATCH inbound email status (admin API). */
export const inboundEmailStatusPatchBodySchema = z.object({
    status: inboundEmailStatusUpdateSchema,
});

export type InboundEmailStatusPatchBody = z.infer<typeof inboundEmailStatusPatchBodySchema>;
