import "server-only";

/**
 * RSVP submission use-case: validate → Supabase insert → fire-and-forget admin email.
 *
 * **Public API** for this slice — import from `@features/rsvp-submit` only these symbols
 * unless you are extending the slice.
 */

export {submitRsvp} from "./api/submit-rsvp";
export type {SubmitRsvpResult} from "./api/submit-rsvp";
