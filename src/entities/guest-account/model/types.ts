/**
 * Row shape for `guest_accounts` in Postgres.
 * Matches `supabase/schema.sql` in this repository.
 */
export interface GuestAccountRow {
    id: string
    rsvp_id: string
    display_name: string
    is_primary: boolean
    sort_order: number
    email: string | null
    created_at: string
}

/**
 * Writable columns for `guest_accounts` (server-generated `id` / `created_at` omitted).
 */
export type GuestAccountRowInsert = Pick<
    GuestAccountRow,
    'rsvp_id' | 'display_name' | 'is_primary' | 'sort_order' | 'email'
>

/**
 * One party member before persistence: primary or companion.
 * Callers build an ordered list (primary first, then companions) and map each row with
 * {@link mapGuestPartyMemberToRowInsert}.
 *
 * **Contact model:** the canonical mailbox on the RSVP row is `rsvp.email`. For convenience and joins,
 * the primary `guest_accounts` row also stores the same address in `guest_accounts.email` when the guest
 * provided one. Companions use `companionEmail` when they bind their own address (otherwise `null`).
 */
export interface GuestPartyMemberInput {
    displayName: string
    isPrimary: boolean
    /**
     * 0 for primary; 1..n for companions in display order.
     * Must match `guest_accounts.sort_order` semantics enforced in the database.
     */
    sortOrder: number
    /**
     * Primary only: same value as persisted `rsvp.email` (trimmed); stored on `guest_accounts.email`.
     * Omit or null when the RSVP has no email.
     */
    primaryRsvpEmail?: string | null
    /** Optional email for companions; ignored when `isPrimary` is true. */
    companionEmail?: string | null
}
