import {z} from "zod";

export const sendInboxReplyBodySchema = z
    .object({
        inbound_email_id: z.string().uuid(),
        template_id: z.string().uuid().nullable().optional(),
        subject: z.string().min(1).max(998).optional(),
        heading: z.string().max(4000),
        body_html: z.string().max(200_000),
    })
    .superRefine((val, ctx) => {
        if (!val.template_id && (!val.subject || val.subject.trim().length === 0)) {
            ctx.addIssue({
                code: "custom",
                message: "subject is required when template_id is omitted",
                path: ["subject"],
            });
        }
    });

export type SendInboxReplyInput = z.infer<typeof sendInboxReplyBodySchema>;
