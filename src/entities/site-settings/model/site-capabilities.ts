import {z} from 'zod'

/** Values of Postgres enum `site_feature_state` and public API wire format. */
export const FEATURE_STATE_VALUES = ['hidden', 'preview', 'enabled'] as const

export type FeatureState = (typeof FEATURE_STATE_VALUES)[number]

export const featureStateSchema = z.enum(FEATURE_STATE_VALUES)

/**
 * Keys stored in `site_feature_states.feature_key` (TEXT PK). Keep in sync with migrations and admin UI.
 */
export const SITE_FEATURE_KEYS = [
    'ourStory',
    'scheduleSection',
    'rsvp',
    'galleryBrowse',
    'galleryUpload',
    'wishSubmit',
    'galleryPhotoDelete',
    'wishPhotoAttach',
] as const

export type SiteFeatureKey = (typeof SITE_FEATURE_KEYS)[number]

/** @deprecated Prefer {@link SITE_FEATURE_KEYS} — alias for incremental migration of imports. */
export const SITE_CAPABILITY_KEYS = SITE_FEATURE_KEYS

/** @deprecated Prefer {@link SiteFeatureKey}. */
export type SiteCapabilityKey = SiteFeatureKey

export type SiteFeatureStates = Record<SiteFeatureKey, FeatureState>

/** @deprecated Prefer {@link SiteFeatureStates}. */
export type SiteCapabilities = SiteFeatureStates

export const siteFeatureStatesSchema = z
    .object({
        ourStory: featureStateSchema,
        scheduleSection: featureStateSchema,
        rsvp: featureStateSchema,
        galleryBrowse: featureStateSchema,
        galleryUpload: featureStateSchema,
        wishSubmit: featureStateSchema,
        galleryPhotoDelete: featureStateSchema,
        wishPhotoAttach: featureStateSchema,
    })
    .strict()

/** @deprecated Prefer {@link siteFeatureStatesSchema}. */
export const siteCapabilitiesSchema = siteFeatureStatesSchema

export const DEFAULT_SITE_FEATURE_STATES: SiteFeatureStates = {
    ourStory: 'enabled',
    scheduleSection: 'enabled',
    rsvp: 'enabled',
    galleryBrowse: 'enabled',
    galleryUpload: 'enabled',
    wishSubmit: 'enabled',
    galleryPhotoDelete: 'enabled',
    wishPhotoAttach: 'enabled',
}

/** @deprecated Prefer {@link DEFAULT_SITE_FEATURE_STATES}. */
export const DEFAULT_SITE_CAPABILITIES = DEFAULT_SITE_FEATURE_STATES

function isSiteFeatureKey(key: string): key is SiteFeatureKey {
    return (SITE_FEATURE_KEYS as readonly string[]).includes(key)
}

/** Parses a single enum label from the DB or API (invalid → null). */
export function parseFeatureStateFromDb(value: unknown): FeatureState | null {
    const parsed = featureStateSchema.safeParse(value)
    return parsed.success ? parsed.data : null
}

/**
 * Builds the feature map from `site_feature_states` rows. Unknown keys are ignored; missing keys keep code defaults.
 */
export function parseFeatureStatesFromDbRows(rows: unknown): SiteFeatureStates {
    if (!Array.isArray(rows)) {
        return {...DEFAULT_SITE_FEATURE_STATES}
    }
    const next = {...DEFAULT_SITE_FEATURE_STATES}
    for (const row of rows) {
        if (!row || typeof row !== 'object') {
            continue
        }
        const featureKey = (row as {feature_key?: unknown}).feature_key
        const state = (row as {state?: unknown}).state
        if (typeof featureKey !== 'string' || !isSiteFeatureKey(featureKey)) {
            continue
        }
        const parsed = parseFeatureStateFromDb(state)
        if (parsed) {
            next[featureKey] = parsed
        }
    }
    return next
}

function parseLegacyBooleanCapabilitiesJson(raw: unknown): SiteFeatureStates | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return null
    }
    const record = raw as Record<string, unknown>
    let anyBoolean = false
    const next = {...DEFAULT_SITE_FEATURE_STATES}
    for (const key of SITE_FEATURE_KEYS) {
        const v = record[key]
        if (typeof v === 'boolean') {
            anyBoolean = true
            next[key] = v ? 'enabled' : 'hidden'
        }
    }
    return anyBoolean ? next : null
}

/**
 * Normalizes feature state input from the DB: `site_feature_states` rows, legacy `capabilities` JSON booleans
 * (tests / pre-migration), or defaults.
 */
export function parseFeatureStatesFromDb(raw: unknown): SiteFeatureStates {
    if (raw === undefined || raw === null) {
        return {...DEFAULT_SITE_FEATURE_STATES}
    }
    if (Array.isArray(raw)) {
        return parseFeatureStatesFromDbRows(raw)
    }
    const legacy = parseLegacyBooleanCapabilitiesJson(raw)
    if (legacy) {
        return legacy
    }
    return {...DEFAULT_SITE_FEATURE_STATES}
}

/** @deprecated Prefer {@link parseFeatureStatesFromDb}. */
export function parseCapabilitiesFromDb(raw: unknown): SiteFeatureStates {
    return parseFeatureStatesFromDb(raw)
}

export function isFeatureEnabled(state: FeatureState): boolean {
    return state === 'enabled'
}

export function isFeatureHidden(state: FeatureState): boolean {
    return state === 'hidden'
}

/** `preview` — teaser / copy only; no primary control (upload, file input, delete button). */
export function isFeaturePreview(state: FeatureState): boolean {
    return state === 'preview'
}

/**
 * Whether a **secondary** control (photo attach, upload dropzone, delete) should mount for interaction.
 * Only `enabled` mounts the real control; `preview` uses {@link isFeaturePreview} copy-only UI; `hidden` omits it.
 */
export function isFeatureControlInteractive(state: FeatureState): boolean {
    return state === 'enabled'
}

/** Navigation and dedicated routes: show links for preview and enabled. */
export function isFeatureNavVisible(state: FeatureState): boolean {
    return state !== 'hidden'
}

/**
 * When {@link wishSubmit} is `enabled` and the guest RSVP’d **not attending**, treat `wishPhotoAttach` as `enabled`
 * so those guests can attach a photo without the celebration window and regardless of preview/hidden on the attach flag.
 * Attending guests and anonymous submitters keep the site setting as stored.
 */
export function resolveWishPhotoAttachForGuest(
    wishSubmit: FeatureState,
    wishPhotoAttach: FeatureState,
    guest: { attending: boolean } | null,
): FeatureState {
    if (isFeatureEnabled(wishSubmit) && guest !== null && guest.attending === false) {
        return 'enabled'
    }
    return wishPhotoAttach
}

/** Whether wish photo upload / attach is allowed for this guest (after {@link resolveWishPhotoAttachForGuest}). */
export function isWishPhotoAttachmentAllowedForGuest(
    capabilities: Pick<SiteFeatureStates, 'wishSubmit' | 'wishPhotoAttach'>,
    guest: { attending: boolean } | null,
): boolean {
    return isFeatureEnabled(
        resolveWishPhotoAttachForGuest(
            capabilities.wishSubmit,
            capabilities.wishPhotoAttach,
            guest,
        ),
    )
}
