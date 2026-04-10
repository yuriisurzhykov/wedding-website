import type {SiteNavRegistryEntry} from '@entities/site-nav'

import {getSiteFeaturesSnapshot} from './site-features'

/**
 * Drops nav targets whose sections are hidden by site feature flags (e.g. Our Story).
 * Call after session-based filtering if both apply.
 */
export function filterSiteNavRegistryForSiteFeatures(
    entries: readonly SiteNavRegistryEntry[],
): SiteNavRegistryEntry[] {
    const {ourStory} = getSiteFeaturesSnapshot()
    return entries.filter((entry) => {
        if (entry.navKey === 'story') {
            return ourStory
        }
        return true
    })
}
