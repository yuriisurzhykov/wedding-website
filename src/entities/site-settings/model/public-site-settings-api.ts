import {z} from 'zod'

import {siteCapabilitiesSchema} from './site-capabilities'

/**
 * JSON body for `GET /api/site-settings/public` (200). No secrets — capabilities + version stamp for client refetch.
 */
export const publicSiteSettingsApiSuccessSchema = z
    .object({
        ok: z.literal(true),
        updated_at: z.string(),
        capabilities: siteCapabilitiesSchema,
    })
    .strict()

export type PublicSiteSettingsApiSuccess = z.infer<typeof publicSiteSettingsApiSuccessSchema>
