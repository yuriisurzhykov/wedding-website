import "server-only";

import {z} from "zod";

export const adminLoginBodySchema = z.object({
    password: z.string().min(1),
});

export type AdminLoginBody = z.infer<typeof adminLoginBodySchema>;
