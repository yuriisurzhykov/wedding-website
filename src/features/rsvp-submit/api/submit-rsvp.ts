import "server-only";

import {mapRsvpFormToRow, type RsvpRowInsert} from "@entities/rsvp";
import {buildGuestSessionClientSnapshot, type GuestSessionClientSnapshot} from "@features/guest-session";
import {createGuestSession} from "@features/guest-session/server";
import {createServerClient} from "@shared/api/supabase/server";
import {resolvePublicSiteBaseForServerEmail} from "@shared/lib/get-public-site-url";

import {resolveGuestMagicLinkClaimUrl} from "../lib/build-guest-magic-link-claim-url";
import {notifyAdminOfNewRsvp} from "../lib/notify-admin";
import {notifyGuestRsvpConfirmation} from "../lib/notify-guest-rsvp-confirmation";
import {persistRsvpRow} from "../lib/persist-rsvp-row";
import {parseRsvpPayload} from "../lib/validate-payload";

/** Optional server context so guest email can infer absolute URLs when env is not set. */
export type SubmitRsvpContext = {
    /** Incoming RSVP `Request` — used to derive site origin from `Host` / `x-forwarded-*` for email links. */
    request?: Request;
};

/**
 * Opaque token + UI snapshot; consumed by `POST /api/rsvp` for `Set-Cookie` + JSON only — never logged to client JSON.
 */
export type SubmitRsvpGuestSession = {
    rawToken: string;
    snapshot: GuestSessionClientSnapshot;
};

/**
 * Creates a `guest_sessions` row after RSVP persistence and maps it to the §4 cookie + snapshot for the HTTP layer.
 */
async function tryCreateGuestSessionAfterSave(
    supabase: Parameters<typeof persistRsvpRow>[0],
    rsvpId: string,
    row: RsvpRowInsert,
): Promise<SubmitRsvpGuestSession | null> {
    const created = await createGuestSession(supabase, rsvpId);
    if (!created.ok) {
        console.error(`[rsvp-submit] guest session: ${created.message}`);
        return null;
    }
    return {
        rawToken: created.rawToken,
        snapshot: buildGuestSessionClientSnapshot({
            name: row.name,
            email: row.email,
        }),
    };
}

/**
 * Outcome of {@link submitRsvp}. Used by the HTTP route to map to status codes and JSON.
 *
 * - **`validation`** — Body failed Zod checks; safe to return **400** with `fieldErrors` / `formErrors`.
 * - **`config`** — Server env for Supabase is missing; treat as **500** (misconfiguration).
 * - **`database`** — Supabase persist failed; treat as **500** (log `message`, generic body to client).
 * - **`notification`** — Row was saved (insert or update), but admin or guest email failed; treat as **502** (RSVP is saved; client should toast and avoid implying the full mail pipeline succeeded).
 * - **`guestSession`** — Present when `guest_sessions` was created after save (`null` if creation failed; RSVP row still saved).
 */
export type SubmitRsvpResult =
    | {ok: true; id: string; guestSession: SubmitRsvpGuestSession | null}
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
          guestSession: SubmitRsvpGuestSession | null;
      };

/**
 * Validates the payload, upserts into `rsvp` (unique non-null `email` / `phone`), then sends mail **in order**:
 * admin first, guest only after admin succeeds (guest only if `row.email` is non-empty). Any mail failure after
 * save yields `{ ok: false, kind: 'notification', … }` while the row remains in the database.
 *
 * @param rawBody — Parsed JSON from the client (unknown shape until validated).
 * @returns {@link SubmitRsvpResult} — never throws; callers translate `kind` to HTTP.
 */
export async function submitRsvp(
    rawBody: unknown,
    context?: SubmitRsvpContext,
): Promise<SubmitRsvpResult> {
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
    const guestSession = await tryCreateGuestSessionAfterSave(supabase, id, row);
    const siteBase = resolvePublicSiteBaseForServerEmail(context?.request);
    const magicLinkClaimUrl = await resolveGuestMagicLinkClaimUrl(
        supabase,
        id,
        locale,
        siteBase,
    );

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
            guestSession,
        };
    }

    if (row.email?.trim()) {
        try {
            await notifyGuestRsvpConfirmation(row, locale, {
                publicSiteUrl: siteBase,
                magicLinkClaimUrl,
            });
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
                guestSession,
            };
        }
    }

    return {ok: true, id, guestSession};
}
