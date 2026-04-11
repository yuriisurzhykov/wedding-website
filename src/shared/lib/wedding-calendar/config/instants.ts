/**
 * Absolute moments on the timeline (ISO 8601 with a fixed offset).
 *
 * **Edit this file only** when ceremony, celebration start, or RSVP cutoff **instants** change.
 * Offset must match the wall time you intend for that calendar day (account for PDT vs PST).
 *
 * Downstream code never imports this directly from the app — use `@shared/lib/wedding-calendar`.
 */

export const WEDDING_INSTANTS = {
    weddingCeremony: '2026-06-13T15:00:00-07:00',
    /** When the celebration segment begins; aligns with `day-program` dinner row. */
    celebrationStart: '2026-06-13T18:00:00-07:00',
    rsvpDeadline: '2026-05-15T23:59:59-07:00',
} as const

export type WeddingInstantId = keyof typeof WEDDING_INSTANTS
