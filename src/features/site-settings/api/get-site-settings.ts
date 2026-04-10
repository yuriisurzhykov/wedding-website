import 'server-only'

import {
    getDefaultSiteSettings,
    normalizeSiteSettingsRow,
    type SiteSettings,
} from '@entities/site-settings'
import {createPublishableServerClient} from '@shared/api/supabase/publishable-server-client'
import {unstable_cache} from 'next/cache'

import {mergePublicEnvIntoCapabilities} from '../lib/merge-public-env-capabilities'

function withEnvCapabilityOverlay(settings: SiteSettings): SiteSettings {
    return {
        ...settings,
        capabilities: mergePublicEnvIntoCapabilities(settings.capabilities),
    }
}

/** Passed to `revalidateTag` after admin updates so RSC and cached reads refresh. */
export const SITE_SETTINGS_CACHE_TAG = 'site-settings'

/** Normalized row from DB (or code defaults); no `NEXT_PUBLIC_SITE_FEATURES` overlay. */
async function readNormalizedSiteSettingsFromDatabase(): Promise<SiteSettings> {
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
 * Loads site settings from Supabase (publishable key, public RLS). Not cached — **database truth** for admin UI and
 * writes; does not apply `NEXT_PUBLIC_SITE_FEATURES` (see {@link getSiteSettingsCached} for the guest-facing snapshot).
 */
export async function getSiteSettings(): Promise<SiteSettings> {
    return readNormalizedSiteSettingsFromDatabase()
}

const getSiteSettingsCachedInner = unstable_cache(
    async () => withEnvCapabilityOverlay(await readNormalizedSiteSettingsFromDatabase()),
    ['site-settings'],
    {
        revalidate: 60,
        tags: [SITE_SETTINGS_CACHE_TAG],
    },
)

/**
 * Cached read for RSC, public API, and feature gates. Applies `NEXT_PUBLIC_SITE_FEATURES` on top of the DB snapshot so
 * deploy-time env can override capabilities for guests (see feature README).
 */
export async function getSiteSettingsCached(): Promise<SiteSettings> {
    return getSiteSettingsCachedInner()
}
