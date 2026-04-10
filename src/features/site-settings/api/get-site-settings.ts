import 'server-only'

import {
    getDefaultSiteSettings,
    normalizeSiteSettingsRow,
    type SiteSettings,
} from '@entities/site-settings'
import {createPublishableServerClient} from '@shared/api/supabase/publishable-server-client'
import {unstable_cache} from 'next/cache'

/** Passed to `revalidateTag` after admin updates so RSC and cached reads refresh. */
export const SITE_SETTINGS_CACHE_TAG = 'site-settings'

async function readSiteSettingsFromDatabase(): Promise<SiteSettings> {
    try {
        const supabase = createPublishableServerClient()
        const {data, error} = await supabase
            .from('site_settings')
            .select('id,updated_at,capabilities,schedule_program')
            .eq('id', 'default')
            .maybeSingle()

        if (error) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[site-settings] read failed:', error.message)
            }
            return getDefaultSiteSettings()
        }

        return normalizeSiteSettingsRow(data)
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        if (process.env.NODE_ENV === 'development') {
            console.warn('[site-settings] read threw:', message)
        }
        return getDefaultSiteSettings()
    }
}

/**
 * Loads site settings from Supabase (publishable key, public RLS). Not cached — use for admin or when bypassing Next
 * data cache is required.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
    return readSiteSettingsFromDatabase()
}

const getSiteSettingsCachedInner = unstable_cache(readSiteSettingsFromDatabase, ['site-settings'], {
    revalidate: 60,
    tags: [SITE_SETTINGS_CACHE_TAG],
})

/**
 * Cached read for RSC and server components. Invalidated via {@link SITE_SETTINGS_CACHE_TAG} after updates.
 */
export async function getSiteSettingsCached(): Promise<SiteSettings> {
    return getSiteSettingsCachedInner()
}
