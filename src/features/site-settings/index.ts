export {
    /** Next.js cache tag for `getSiteSettingsCached`; pass to `revalidateTag` after writes. */
    SITE_SETTINGS_CACHE_TAG,
    /** Uncached read from Supabase (publishable key). */
    getSiteSettings,
    /** Cached read for RSC; invalidated when the tag is revalidated. */
    getSiteSettingsCached,
} from './api/get-site-settings'
export {
    type UpdateSiteSettingsResult,
    /** Validates patch, merges with current row, upserts with service role, revalidates cache tag. */
    updateSiteSettings,
} from './api/update-site-settings'
