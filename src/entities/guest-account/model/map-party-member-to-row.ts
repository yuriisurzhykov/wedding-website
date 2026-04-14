import {
    normalizeGuestAccountEmailForStorage,
    normalizeGuestDisplayNameForStorage,
} from './invariants'
import type {GuestAccountRowInsert, GuestPartyMemberInput} from './types'

/**
 * Maps one party member draft to a `guest_accounts` insert row.
 *
 * - Primary rows omit companion email: `email` is always `null` (party contact lives on `rsvp`).
 * - Companions may carry `companionEmail` when they later bind their own mailbox.
 */
export function mapGuestPartyMemberToRowInsert(
    rsvpId: string,
    member: GuestPartyMemberInput,
): GuestAccountRowInsert {
    const display_name = normalizeGuestDisplayNameForStorage(member.displayName)
    const email = member.isPrimary
        ? null
        : normalizeGuestAccountEmailForStorage(member.companionEmail ?? null)

    return {
        rsvp_id: rsvpId,
        display_name,
        is_primary: member.isPrimary,
        sort_order: member.sortOrder,
        email,
    }
}
