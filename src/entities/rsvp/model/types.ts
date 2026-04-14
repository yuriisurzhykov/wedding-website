/**
 * RSVP row as stored in Postgres (`rsvp` table).
 * Matches `supabase/schema.sql` in this repository.
 */
export interface RsvpRow {
    id: string
    name: string
    email: string | null
    phone: string | null
    attending: boolean
    guest_count: number
    dietary: string | null
    message: string | null
    created_at: string
}

/**
 * Writable columns for `rsvp` (server-generated `id` / `created_at` omitted). Used for insert/update upsert.
 */
export type RsvpRowInsert = Pick<
    RsvpRow,
    'name' | 'email' | 'phone' | 'attending' | 'guest_count' | 'dietary' | 'message'
>

/**
 * RSVP payload in the shape produced by the site RSVP form (`DynamicForm` submit):
 * camelCase keys, optional fields omitted or empty when not applicable.
 *
 * **Invariant:** callers that have passed feature-layer validation should
 * provide a non-empty trimmed `name` and a boolean `attending`. The mapper still coerces
 * and normalizes edge cases from raw JSON.
 */
export interface RsvpFormInput {
    name: string
    email?: string
    phone?: string
    guestCount?: number | string
    /**
     * Names of additional guests when `attending` is true; length must be `guestCount - 1`
     * after validation in `@features/rsvp-submit`.
     */
    companionNames?: string[]
    dietary?: string
    message?: string
    attending: boolean
}
