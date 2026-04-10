import "server-only";

import {revalidateTag} from "next/cache";

import type {GuestSessionPublicErrorCode} from "@features/guest-session";
import {validateGuestSessionFromRequest} from "@features/guest-session/server";
import {GALLERY_PHOTOS_LIST_CACHE_TAG} from "@features/gallery-list";
import {deleteR2Object} from "@shared/api/r2";
import {createServerClient} from "@shared/api/supabase/server";

import {uploadSessionErrorCode} from "../lib/upload-session-error-code";
import {parseDeleteGalleryPhotoPayload} from "../lib/validate-delete-photo-payload";

export type DeleteGalleryPhotoResult =
    | { ok: true }
    | {
    ok: false;
    kind: "validation";
    fieldErrors: Record<string, string[] | undefined>;
    formErrors: string[];
}
    | { ok: false; kind: "no_session"; code: GuestSessionPublicErrorCode }
    | { ok: false; kind: "forbidden" }
    | { ok: false; kind: "config"; message: string }
    | { ok: false; kind: "database"; message: string };

/**
 * Deletes a gallery photo owned by the current guest session (`photos.rsvp_id` matches).
 * Missing photo, another guest’s photo, or legacy rows without `rsvp_id` → single `forbidden` outcome (plan §5.2).
 */
export async function deleteGalleryPhoto(
    rawBody: unknown,
    request: Request,
): Promise<DeleteGalleryPhotoResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const sessionResult = await validateGuestSessionFromRequest(supabase, request);
    if (!sessionResult.ok) {
        return {ok: false, kind: "no_session", code: uploadSessionErrorCode(sessionResult)};
    }

    const rsvpId = sessionResult.session.rsvp_id;

    const parsed = parseDeleteGalleryPhotoPayload(rawBody);
    if (!parsed.success) {
        const flat = parsed.error.flatten();
        return {
            ok: false,
            kind: "validation",
            fieldErrors: flat.fieldErrors,
            formErrors: flat.formErrors,
        };
    }

    const {photoId} = parsed.data;

    const {data: deletedRows, error: deleteError} = await supabase
        .from("photos")
        .delete()
        .eq("id", photoId)
        .eq("rsvp_id", rsvpId)
        .select("r2_key");

    if (deleteError) {
        return {ok: false, kind: "database", message: deleteError.message};
    }

    if (!deletedRows?.length) {
        return {ok: false, kind: "forbidden"};
    }

    const r2Key = deletedRows[0].r2_key as string;

    revalidateTag(GALLERY_PHOTOS_LIST_CACHE_TAG, "max");

    const r2Result = await deleteR2Object(r2Key);
    if (!r2Result.ok) {
        console.error(
            "[gallery-upload] R2 delete failed after DB row removed",
            r2Key,
            r2Result.message,
        );
    }

    return {ok: true};
}
