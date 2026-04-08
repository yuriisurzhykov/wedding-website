import "server-only";

import {createServerClient} from "@/lib/supabase";
import {mapRsvpFormToRow} from "@entities/rsvp";

import {notifyAdminOfNewRsvp} from "../lib/notify-admin";
import {notifyGuestRsvpConfirmation} from "../lib/notify-guest-rsvp-confirmation";
import {persistRsvpRow} from "../lib/persist-rsvp-row";
import {parseRsvpPayload} from "../lib/validate-payload";

/**
 * Outcome of {@link submitRsvp}. Used by the HTTP route to map to status codes and JSON.
 *
 * - **`validation`** — Body failed Zod checks; safe to return **400** with `fieldErrors` / `formErrors`.
 * - **`config`** — Server env for Supabase is missing; treat as **500** (misconfiguration).
 * - **`database`** — Supabase persist failed; treat as **500** (log `message`, generic body to client).
 * - **`notification`** — Row was saved (insert or update), but admin or guest email failed; treat as **502** (RSVP is saved; client should toast and avoid implying the full mail pipeline succeeded).
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
    | {ok: false; kind: "database"; message: string}
    | {
          ok: false;
          kind: "notification";
          step: "admin" | "guest";
          id: string;
          message: string;
      };

/**
 * Validates the payload, upserts into `rsvp` (unique non-null `email` / `phone`), then sends mail **in order**:
 * admin first, guest only after admin succeeds (guest only if `row.email` is non-empty). Any mail failure after
 * save yields `{ ok: false, kind: 'notification', … }` while the row remains in the database.
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
    const saved = await persistRsvpRow(supabase, row);

    if (!saved.ok) {
        return {ok: false, kind: "database", message: saved.message};
    }

    const id = saved.id;

    try {
        await notifyAdminOfNewRsvp(row, id);
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(
            `[rsvp-submit] Admin notification failed after save (id=${id}): ${message}`,
        );
        return {
            ok: false,
            kind: "notification",
            step: "admin",
            id,
            message,
        };
    }

    if (row.email?.trim()) {
        try {
            await notifyGuestRsvpConfirmation(row, locale);
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            console.error(
                `[rsvp-submit] Guest confirmation failed after admin ok (id=${id}): ${message}`,
            );
            return {
                ok: false,
                kind: "notification",
                step: "guest",
                id,
                message,
            };
        }
    }

    return {ok: true, id};
}
