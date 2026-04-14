import {z} from 'zod'

import {getContactInfo} from '@entities/wedding-venue'

/** Resolved phone (display) and email for mailto — always non-empty after merge with code defaults. */
export type PublicContact = {
    phone: string
    email: string
}

/** Raw `site_settings` columns before merging with venue defaults. */
export type PublicContactDbRow = {
    public_contact_phone?: string | null
    public_contact_email?: string | null
}

export function getDefaultPublicContact(): PublicContact {
    return {...getContactInfo()}
}

export const publicContactSchema = z
    .object({
        phone: z.string().min(1).max(160),
        email: z.string().min(1).max(320).pipe(z.email()),
    })
    .strict()

/**
 * Admin PATCH fragment: optional keys; trim on write. Empty string clears that field to the code default in DB.
 * Non-empty `email` must be a valid address.
 */
export const publicContactPatchSchema = z
    .object({
        phone: z.string().max(160).optional(),
        email: z.string().max(320).optional(),
    })
    .strict()
    .superRefine((val, ctx) => {
        if (val.email === undefined) {
            return
        }
        const t = val.email.trim()
        if (t === '') {
            return
        }
        const r = z.string().max(320).pipe(z.email()).safeParse(t)
        if (!r.success) {
            ctx.addIssue({code: 'custom', message: 'Invalid email', path: ['email']})
        }
    })

export type PublicContactPatch = z.infer<typeof publicContactPatchSchema>

/**
 * Merges `site_settings.public_contact_*` columns with venue defaults. NULL, missing column, empty or
 * whitespace-only string for a field → code default for that field. Invalid stored email falls back to default.
 */
export function resolvePublicContactFromDb(row: PublicContactDbRow): PublicContact {
    const defaults = getDefaultPublicContact()
    const phoneRaw = row.public_contact_phone
    const phone =
        typeof phoneRaw === 'string' && phoneRaw.trim() !== '' ? phoneRaw.trim() : defaults.phone

    const emailRaw = row.public_contact_email
    let email = defaults.email
    if (typeof emailRaw === 'string' && emailRaw.trim() !== '') {
        const t = emailRaw.trim()
        const ok = z.string().max(320).pipe(z.email()).safeParse(t)
        email = ok.success ? t : defaults.email
    }
    return {phone, email}
}

/**
 * Applies an admin patch onto the current nullable columns. Empty string in the patch clears that field (stored NULL).
 */
export function mergePublicContactDbColumns(
    current: PublicContactDbRow,
    patch: PublicContactPatch | undefined,
): {public_contact_phone: string | null; public_contact_email: string | null} {
    let phone: string | null =
        typeof current.public_contact_phone === 'string' ? current.public_contact_phone : null
    let email: string | null =
        typeof current.public_contact_email === 'string' ? current.public_contact_email : null

    if (!patch) {
        return {public_contact_phone: phone, public_contact_email: email}
    }
    if (patch.phone !== undefined) {
        const t = patch.phone.trim()
        phone = t === '' ? null : t
    }
    if (patch.email !== undefined) {
        const t = patch.email.trim()
        email = t === '' ? null : t
    }
    return {public_contact_phone: phone, public_contact_email: email}
}
