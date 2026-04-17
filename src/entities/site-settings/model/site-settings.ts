import {z} from 'zod'

import {
    type PublicContact,
    getDefaultPublicContact,
    publicContactPatchSchema,
    publicContactSchema,
    resolvePublicContactFromDb,
} from './public-contact'
import {
    type SiteCapabilities,
    parseFeatureStatesFromDb,
    siteCapabilitiesSchema,
} from './site-capabilities'

export type SiteSettings = {
    id: 'default'
    updated_at: string
    capabilities: SiteCapabilities
    public_contact: PublicContact
    /**
     * When set, inbound mail replies use this `email_senders` row for the Resend `from` line
     * (`formatResendFromLine`). The sender `mailbox` must match `public_contact.email`.
     */
    public_contact_sender_id: string | null
}

export const siteSettingsSchema = z
    .object({
        id: z.literal('default'),
        updated_at: z.string(),
        capabilities: siteCapabilitiesSchema,
        public_contact: publicContactSchema,
        public_contact_sender_id: z.union([z.string().uuid(), z.null()]),
    })
    .strict()

/** Partial update for admin writes; validated before merge with current row. */
export const siteSettingsPatchSchema = z
    .object({
        capabilities: siteCapabilitiesSchema.partial().optional(),
        public_contact: publicContactPatchSchema.optional(),
        public_contact_sender_id: z.union([z.string().uuid(), z.null()]).optional(),
    })
    .strict()

export type SiteSettingsPatch = z.infer<typeof siteSettingsPatchSchema>

/**
 * Synthetic defaults when the table is empty or the process lacks DB access (same behavior as seeded row).
 */
export function getDefaultSiteSettings(): SiteSettings {
    return {
        id: 'default',
        updated_at: new Date(0).toISOString(),
        capabilities: parseFeatureStatesFromDb(undefined),
        public_contact: getDefaultPublicContact(),
        public_contact_sender_id: null,
    }
}

/**
 * Maps Supabase `site_settings` plus optional `site_feature_states` rows to {@link SiteSettings}. Null or invalid
 * fragments fall back to code defaults (see migration seed).
 */
export function normalizeSiteSettingsRow(
    row: {
        id: string
        updated_at: string
        public_contact_phone?: string | null
        public_contact_email?: string | null
        public_contact_sender_id?: string | null
    } | null,
    featureStatesFromDb?: unknown,
): SiteSettings {
    if (!row || row.id !== 'default') {
        return getDefaultSiteSettings()
    }
    const senderId =
        typeof row.public_contact_sender_id === 'string' &&
        row.public_contact_sender_id.trim() !== ''
            ? row.public_contact_sender_id.trim()
            : null
    return {
        id: 'default',
        updated_at: row.updated_at,
        capabilities: parseFeatureStatesFromDb(featureStatesFromDb),
        public_contact: resolvePublicContactFromDb({
            public_contact_phone: row.public_contact_phone,
            public_contact_email: row.public_contact_email,
        }),
        public_contact_sender_id: senderId,
    }
}
