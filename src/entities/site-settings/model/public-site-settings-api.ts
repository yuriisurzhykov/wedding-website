import {z} from 'zod'

import {publicContactSchema} from './public-contact'
import {siteFeatureStatesSchema} from './site-capabilities'

/**
 * JSON body for `GET /api/site-settings/public` (200). No secrets — feature states, public contact snapshot, version
 * stamp for client refetch.
 */
export const publicSiteSettingsApiSuccessSchema = z
    .object({
        ok: z.literal(true),
        updated_at: z.string(),
        capabilities: siteFeatureStatesSchema,
        public_contact: publicContactSchema,
    })
    .strict()

export type PublicSiteSettingsApiSuccess = z.infer<typeof publicSiteSettingsApiSuccessSchema>
