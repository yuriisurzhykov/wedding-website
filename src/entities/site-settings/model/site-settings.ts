import {z} from 'zod'

import {
    type ScheduleProgramItem,
    parseScheduleProgramFromDb,
    scheduleProgramSchema,
} from './schedule-program'
import {
    type SiteCapabilities,
    parseCapabilitiesFromDb,
    siteCapabilitiesSchema,
} from './site-capabilities'

export type SiteSettings = {
    id: 'default'
    updated_at: string
    capabilities: SiteCapabilities
    schedule_program: ScheduleProgramItem[]
}

export const siteSettingsSchema = z
    .object({
        id: z.literal('default'),
        updated_at: z.string(),
        capabilities: siteCapabilitiesSchema,
        schedule_program: scheduleProgramSchema,
    })
    .strict()

/** Partial update for admin writes; validated before merge with current row. */
export const siteSettingsPatchSchema = z
    .object({
        capabilities: siteCapabilitiesSchema.partial().optional(),
        schedule_program: scheduleProgramSchema.optional(),
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
        capabilities: parseCapabilitiesFromDb(undefined),
        schedule_program: parseScheduleProgramFromDb(undefined),
    }
}

/**
 * Maps a Supabase row (or null) to a normalized {@link SiteSettings}. Null or invalid fragments fall back to code
 * defaults (see migration seed and `day-program.ts`).
 */
export function normalizeSiteSettingsRow(
    row: {
        id: string
        updated_at: string
        capabilities: unknown
        schedule_program: unknown
    } | null,
): SiteSettings {
    if (!row || row.id !== 'default') {
        return getDefaultSiteSettings()
    }
    return {
        id: 'default',
        updated_at: row.updated_at,
        capabilities: parseCapabilitiesFromDb(row.capabilities),
        schedule_program: parseScheduleProgramFromDb(row.schedule_program),
    }
}
