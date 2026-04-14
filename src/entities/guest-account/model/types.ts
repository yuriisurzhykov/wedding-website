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
 * **Contact model:** the primary member’s mailbox for product flows is the parent `rsvp.email`;
 * `companionEmail` is only for non-primary members who claim their own address (otherwise `null`).
 */
export interface GuestPartyMemberInput {
    displayName: string
    isPrimary: boolean
    /**
     * 0 for primary; 1..n for companions in display order.
     * Must match `guest_accounts.sort_order` semantics enforced in the database.
     */
    sortOrder: number
    /** Optional email for companions; ignored when `isPrimary` is true. */
    companionEmail?: string | null
}
