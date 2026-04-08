import "server-only";

/**
 * RSVP submission use-case: validate → Supabase upsert (`persistRsvpRow`) → ordered email notifications.
 *
 * **Public API** for this slice — import from `@features/rsvp-submit` only these symbols
 * unless you are extending the slice.
 */

export {submitRsvp} from "./api/submit-rsvp";
export type {SubmitRsvpResult} from "./api/submit-rsvp";
