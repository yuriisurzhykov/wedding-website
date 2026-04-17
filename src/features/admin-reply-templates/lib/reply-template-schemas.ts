import {z} from "zod";

export const replyTemplateCreateSchema = z.object({
    name: z.string().min(1).max(200),
    subject: z.string().min(1).max(500),
    heading: z.string().min(1).max(500),
    body_html: z.string().min(1).max(200_000),
    body_text: z.string().max(200_000).optional().nullable(),
    is_default: z.boolean().optional().default(false),
});

export const replyTemplateUpdateSchema = replyTemplateCreateSchema.partial();

export type ReplyTemplateCreateInput = z.infer<typeof replyTemplateCreateSchema>;
export type ReplyTemplateUpdateInput = z.infer<typeof replyTemplateUpdateSchema>;
