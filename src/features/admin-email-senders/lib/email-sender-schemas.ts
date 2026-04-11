import {z} from "zod";

const emailSchema = z.string().email().max(320);

export const emailSenderCreateSchema = z.object({
    label: z.string().min(1).max(200),
    mailbox: emailSchema,
    display_name: z.string().max(200).optional().nullable(),
});

export const emailSenderUpdateSchema = emailSenderCreateSchema.partial();

export type EmailSenderCreateInput = z.infer<typeof emailSenderCreateSchema>;
export type EmailSenderUpdateInput = z.infer<typeof emailSenderUpdateSchema>;
