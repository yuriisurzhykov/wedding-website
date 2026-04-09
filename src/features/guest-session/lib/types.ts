/**
 * Row shape for `guest_sessions` (API / service role). Dates are ISO strings from Supabase.
 */
export type GuestSessionRow = {
    id: string;
    rsvp_id: string;
    token_hash: string;
    expires_at: string;
    created_at: string | null;
    last_seen_at: string | null;
};

export type ValidateGuestSessionResult =
    | {
          ok: true;
          session: GuestSessionRow;
      }
    | {
          ok: false;
          reason: "missing" | "invalid" | "expired" | "database";
          message?: string;
      };

/** Failed validation branch; use with {@link mapValidateGuestSessionFailureToCode}. */
export type GuestSessionValidateFailure = Extract<
    ValidateGuestSessionResult,
    {ok: false}
>;
