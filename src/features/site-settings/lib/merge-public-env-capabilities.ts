import {SITE_CAPABILITY_KEYS, type SiteCapabilities,} from '@entities/site-settings'

function isSiteCapabilityKey(value: string): value is keyof SiteCapabilities {
    return (SITE_CAPABILITY_KEYS as readonly string[]).includes(value)
}

/**
 * Applies `NEXT_PUBLIC_SITE_FEATURES` JSON on top of capabilities already resolved from the database (and code
 * defaults). **Env wins** per key when the value is a boolean, so deploy-time toggles can override admin/DB in dev and
 * CI without changing `site_settings`.
 */
export function mergePublicEnvIntoCapabilities(
    capabilities: SiteCapabilities,
): SiteCapabilities {
    const raw = process.env.NEXT_PUBLIC_SITE_FEATURES
    if (raw === undefined || raw.trim() === '') {
        return capabilities
    }
    try {
        const parsed: unknown = JSON.parse(raw)
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return capabilities
        }
        const record = parsed as Record<string, unknown>
        const out: SiteCapabilities = {...capabilities}
        for (const key of Object.keys(record)) {
            if (!isSiteCapabilityKey(key)) {
                continue
            }
            const v = record[key]
            if (typeof v === 'boolean') {
                out[key] = v
            }
        }
        return out
    } catch {
        if (process.env.NODE_ENV === 'development') {
            console.warn(
                '[site-settings] NEXT_PUBLIC_SITE_FEATURES is not valid JSON; ignoring env overrides.',
            )
        }
        return capabilities
    }
}
