import {z} from 'zod'

/** Fixed capability keys stored in `site_settings.capabilities` (JSON). */
export const SITE_CAPABILITY_KEYS = [
    'ourStory',
    'scheduleSection',
    'rsvp',
    'galleryUpload',
    'wishSubmit',
    'galleryPhotoDelete',
    'wishPhotoAttach',
] as const

export type SiteCapabilityKey = (typeof SITE_CAPABILITY_KEYS)[number]

export type SiteCapabilities = Record<SiteCapabilityKey, boolean>

export const siteCapabilitiesSchema = z
    .object({
        ourStory: z.boolean(),
        scheduleSection: z.boolean(),
        rsvp: z.boolean(),
        galleryUpload: z.boolean(),
        wishSubmit: z.boolean(),
        galleryPhotoDelete: z.boolean(),
        wishPhotoAttach: z.boolean(),
    })
    .strict()

export const DEFAULT_SITE_CAPABILITIES: SiteCapabilities = {
    ourStory: true,
    scheduleSection: true,
    rsvp: true,
    galleryUpload: true,
    wishSubmit: true,
    galleryPhotoDelete: true,
    wishPhotoAttach: true,
}

/**
 * Parses JSON from DB and merges with {@link DEFAULT_SITE_CAPABILITIES} so new keys stay backward compatible.
 */
export function parseCapabilitiesFromDb(raw: unknown): SiteCapabilities {
    const parsed = siteCapabilitiesSchema.safeParse(raw)
    if (!parsed.success) {
        return {...DEFAULT_SITE_CAPABILITIES}
    }
    return {...DEFAULT_SITE_CAPABILITIES, ...parsed.data}
}
