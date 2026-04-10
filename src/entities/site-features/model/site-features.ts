import type {SiteFeatureId, SiteFeatures} from './types'

const SITE_FEATURE_IDS = ['ourStory'] as const satisfies readonly SiteFeatureId[]

const DEFAULT_SITE_FEATURES: SiteFeatures = {
    ourStory: true,
}

function isSiteFeatureId(value: string): value is SiteFeatureId {
    return (SITE_FEATURE_IDS as readonly string[]).includes(value)
}

function buildSiteFeatures(): SiteFeatures {
    const out: SiteFeatures = {...DEFAULT_SITE_FEATURES}
    const raw = process.env.NEXT_PUBLIC_SITE_FEATURES
    if (raw === undefined || raw.trim() === '') {
        return out
    }
    try {
        const parsed: unknown = JSON.parse(raw)
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return out
        }
        const record = parsed as Record<string, unknown>
        for (const key of Object.keys(record)) {
            if (!isSiteFeatureId(key)) {
                continue
            }
            const v = record[key]
            if (typeof v === 'boolean') {
                out[key] = v
            }
        }
    } catch {
        if (process.env.NODE_ENV === 'development') {
            console.warn(
                '[site-features] NEXT_PUBLIC_SITE_FEATURES is not valid JSON; using defaults.',
            )
        }
    }
    return out
}

const SITE_FEATURES_SNAPSHOT: SiteFeatures = buildSiteFeatures()

/**
 * Resolved once per bundle (server vs client each have their own). Uses
 * {@link DEFAULT_SITE_FEATURES} and optional `NEXT_PUBLIC_SITE_FEATURES` JSON overrides.
 */
export function getSiteFeaturesSnapshot(): Readonly<SiteFeatures> {
    return SITE_FEATURES_SNAPSHOT
}

/** Whether a site feature is enabled for this build/environment. */
export function isSiteFeatureEnabled(id: SiteFeatureId): boolean {
    return SITE_FEATURES_SNAPSHOT[id]
}
