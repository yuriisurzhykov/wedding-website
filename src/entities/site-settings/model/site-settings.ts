import {z} from 'zod'

import {
    type SiteCapabilities,
    parseFeatureStatesFromDb,
    siteCapabilitiesSchema,
} from './site-capabilities'

export type SiteSettings = {
    id: 'default'
    updated_at: string
    capabilities: SiteCapabilities
}

export const siteSettingsSchema = z
    .object({
        id: z.literal('default'),
        updated_at: z.string(),
        capabilities: siteCapabilitiesSchema,
    })
    .strict()

/** Partial update for admin writes; validated before merge with current row. */
export const siteSettingsPatchSchema = z
    .object({
        capabilities: siteCapabilitiesSchema.partial().optional(),
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
    } | null,
    featureStatesFromDb?: unknown,
): SiteSettings {
    if (!row || row.id !== 'default') {
        return getDefaultSiteSettings()
    }
    return {
        id: 'default',
        updated_at: row.updated_at,
        capabilities: parseFeatureStatesFromDb(featureStatesFromDb),
    }
}
