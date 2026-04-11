import {z} from "zod";

const slugSchema = z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case");

export const emailTemplateCreateSchema = z.object({
    slug: slugSchema,
    name: z.string().min(1).max(200),
    subject_template: z.string().min(1).max(500),
    body_html: z.string().min(1).max(200_000),
    body_text: z.string().max(200_000).optional().nullable(),
    sender_id: z.string().uuid().nullable().optional(),
});

export const emailTemplateUpdateSchema = emailTemplateCreateSchema.partial();

export type EmailTemplateCreateInput = z.infer<typeof emailTemplateCreateSchema>;
export type EmailTemplateUpdateInput = z.infer<typeof emailTemplateUpdateSchema>;
