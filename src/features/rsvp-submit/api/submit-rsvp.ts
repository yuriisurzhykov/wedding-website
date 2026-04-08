import "server-only";

import {createServerClient} from "@/lib/supabase";
import {mapRsvpFormToRow} from "@entities/rsvp";

import {notifyAdminOfNewRsvp} from "../lib/notify-admin";
import {notifyGuestRsvpConfirmation} from "../lib/notify-guest-rsvp-confirmation";
import {parseRsvpPayload} from "../lib/validate-payload";

/**
 * Outcome of {@link submitRsvp}. Used by the HTTP route to map to status codes and JSON.
 *
 * - **`validation`** — Body failed Zod checks; safe to return **400** with `fieldErrors` / `formErrors`.
 * - **`config`** — Server env for Supabase is missing; treat as **500** (misconfiguration).
 * - **`database`** — Supabase insert failed; treat as **500** (log `message`, generic body to client).
 */
export type SubmitRsvpResult =
    | {ok: true; id: string}
    | {
          ok: false;
          kind: "validation";
          fieldErrors: Record<string, string[] | undefined>;
          formErrors: string[];
      }
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "database"; message: string};

function logNotifyFailure(err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[rsvp-submit] Admin notification failed (RSVP still saved):", msg);
}

function logGuestNotifyFailure(err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
        "[rsvp-submit] Guest confirmation failed (RSVP still saved):",
        msg,
    );
}

/**
 * Validates the payload, inserts into `rsvp` via service-role Supabase, then **schedules** admin email
 * without blocking the returned result on email delivery.
 *
 * **Email:** Admin and (when `email` is set) guest notifications are fire-and-forget. Missing Resend/admin
 * env no-ops with a warning where applicable. Resend errors are logged only; the function still resolves
 * with `{ ok: true }` when the row was inserted.
 *
 * @param rawBody — Parsed JSON from the client (unknown shape until validated).
 * @returns {@link SubmitRsvpResult} — never throws; callers translate `kind` to HTTP.
 */
export async function submitRsvp(rawBody: unknown): Promise<SubmitRsvpResult> {
    const parsed = parseRsvpPayload(rawBody);
    if (!parsed.ok) {
        const flat = parsed.error.flatten();
        return {
            ok: false,
            kind: "validation",
            fieldErrors: flat.fieldErrors,
            formErrors: flat.formErrors,
        };
    }

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const row = mapRsvpFormToRow(parsed.data);
    const locale = parsed.locale;
    const {data, error} = await supabase
        .from("rsvp")
        .insert(row)
        .select("id")
        .single();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    const id = data?.id;
    if (!id) {
        return {
            ok: false,
            kind: "database",
            message: "Insert succeeded but no id was returned",
        };
    }

    void notifyAdminOfNewRsvp(row, id).catch(logNotifyFailure);
    if (row.email?.trim()) {
        void notifyGuestRsvpConfirmation(row, locale).catch(logGuestNotifyFailure);
    }

    return {ok: true, id};
}
