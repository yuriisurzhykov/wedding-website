import type {RsvpFormInput, RsvpRowInsert} from './types'

/** Used when `attending === true` but the client sent no parsable guest count. */
const defaultGuestCountWhenAttending = 1

/**
 * Stored guest count when the guest is not attending. Chosen so aggregates that
 * sum `guest_count` only for `attending = true` stay meaningful; the value is otherwise unused in UX.
 */
const storedGuestCountWhenNotAttending = 0

function normalizeOptionalText(value: unknown): string | null {
    if (value === undefined || value === null) return null
    const s = String(value).trim()
    return s === '' ? null : s
}

function parseGuestCount(value: unknown): number | null {
    if (value === undefined || value === null || value === '') return null
    const n = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(n) && Number.isInteger(n) && n >= 0 ? n : null
}

/**
 * Maps a camelCase RSVP form payload to a row shape for Supabase `insert`.
 *
 * **Normalization**
 * - Trims text fields; empty optional strings become `null`.
 * - If `attending` is false, `dietary` is forced to `null` (ignores stale UI state).
 * - If `attending` is false, `guest_count` is set to an internal default (not exported).
 * - If `attending` is true and `guestCount` is missing or invalid, uses an internal default.
 *
 * @param input — Typically JSON body or `FormValues` after client submit.
 * @returns Payload ready for `from('rsvp').insert(...)`.
 */
export function mapRsvpFormToRow(input: RsvpFormInput): RsvpRowInsert {
    const name = String(input.name ?? '').trim()
    const attending = Boolean(input.attending)

    const guest_count = attending
        ? (parseGuestCount(input.guestCount) ?? defaultGuestCountWhenAttending)
        : storedGuestCountWhenNotAttending

    return {
        name,
        email: normalizeOptionalText(input.email),
        phone: normalizeOptionalText(input.phone),
        attending,
        guest_count,
        dietary: attending ? normalizeOptionalText(input.dietary) : null,
        message: normalizeOptionalText(input.message),
    }
}
