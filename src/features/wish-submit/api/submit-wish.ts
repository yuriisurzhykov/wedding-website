import "server-only";

import {loadRsvpIdentityForUpload} from "@features/gallery-upload";
import {validateGuestSessionFromRequest} from "@features/guest-session/server";
import {createServerClient} from "@shared/api/supabase/server";
import {assertR2UploadConfig} from "@shared/api/r2";
import {canAttachWishPhotoAt} from "@shared/lib/wedding-calendar";

import {parseWishSubmitPayload} from "../lib/validate-wish-payload";
import {persistWishRow} from "../lib/persist-wish-row";

export type SubmitWishResult =
    | { ok: true }
    | {
    ok: false;
    kind: "validation";
    fieldErrors: Record<string, string[] | undefined>;
    formErrors: string[];
}
    | { ok: false; kind: "config"; message: string }
    | { ok: false; kind: "database"; message: string }
    | { ok: false; kind: "celebration"; message: string };

/**
 * Validates JSON and inserts into `wishes` (service role). Optional `photoR2Key` must
 * refer to an object already uploaded under `photos/`; `photo_url` is derived from `R2_PUBLIC_URL`.
 *
 * When the request carries a valid guest session cookie, `authorName` in the body is
 * ignored and `rsvp.name` is used (same source as gallery uploads).
 */
export async function submitWish(
    rawBody: unknown,
    request: Request,
): Promise<SubmitWishResult> {
    const parsed = parseWishSubmitPayload(rawBody);
    if (!parsed.ok) {
        const flat = parsed.error.flatten();
        return {
            ok: false,
            kind: "validation",
            fieldErrors: flat.fieldErrors,
            formErrors: flat.formErrors,
        };
    }

    const {authorName: authorNameRaw, message, photoR2Key} = parsed.data;

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const sessionResult = await validateGuestSessionFromRequest(supabase, request);

    let authorName: string;
    if (sessionResult.ok) {
        const identity = await loadRsvpIdentityForUpload(
            supabase,
            sessionResult.session.rsvp_id,
        );
        if (!identity.ok) {
            return {ok: false, kind: "database", message: identity.message};
        }
        authorName = identity.name;

        if (
            photoR2Key &&
            !canAttachWishPhotoAt(new Date(), {
                kind: "session",
                attending: identity.attending,
            })
        ) {
            return {
                ok: false,
                kind: "celebration",
                message: "Wish photos are available after the celebration begins.",
            };
        }
    } else {
        const fromClient = authorNameRaw?.trim() ?? "";
        if (!fromClient) {
            return {
                ok: false,
                kind: "validation",
                fieldErrors: {authorName: ["Required"]},
                formErrors: [],
            };
        }
        authorName = fromClient;

        if (
            photoR2Key &&
            !canAttachWishPhotoAt(new Date(), {kind: "anonymous"})
        ) {
            return {
                ok: false,
                kind: "celebration",
                message: "Wish photos are available after the celebration begins.",
            };
        }
    }

    let photoUrl: string | null = null;
    if (photoR2Key) {
        try {
            const {publicUrlBase} = assertR2UploadConfig();
            photoUrl = `${publicUrlBase}/${photoR2Key}`;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            return {ok: false, kind: "config", message: msg};
        }
    }

    const saved = await persistWishRow(supabase, {
        authorName,
        message,
        photoR2Key: photoR2Key ?? null,
        photoUrl,
    });

    if (!saved.ok) {
        return {ok: false, kind: "database", message: saved.message};
    }

    return {ok: true};
}
