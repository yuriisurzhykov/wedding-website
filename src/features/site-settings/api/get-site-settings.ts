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

/** Normalized settings from DB (or code defaults). */
async function readNormalizedSiteSettingsFromDatabase(): Promise<SiteSettings> {
    try {
        const supabase = createPublishableServerClient()
        const [siteResult, featuresResult] = await Promise.all([
            supabase
                .from('site_settings')
                .select(
                    'id,updated_at,public_contact_phone,public_contact_email,public_contact_sender_id',
                )
                .eq('id', 'default')
                .maybeSingle(),
            supabase.from('site_feature_states').select('feature_key,state'),
        ])

        if (siteResult.error) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[site-settings] site_settings read failed:', siteResult.error.message)
            }
            return getDefaultSiteSettings()
        }

        if (featuresResult.error) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[site-settings] site_feature_states read failed:', featuresResult.error.message)
            }
        }

        return normalizeSiteSettingsRow(siteResult.data, featuresResult.data ?? undefined)
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
 * writes.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
    return readNormalizedSiteSettingsFromDatabase()
}

const getSiteSettingsCachedInner = unstable_cache(
    async () => readNormalizedSiteSettingsFromDatabase(),
    ['site-settings'],
    {
        revalidate: 60,
        tags: [SITE_SETTINGS_CACHE_TAG],
    },
)

/**
 * Cached read for RSC, public API, and feature gates. Same DB snapshot as {@link getSiteSettings}.
 */
export async function getSiteSettingsCached(): Promise<SiteSettings> {
    return getSiteSettingsCachedInner()
}
