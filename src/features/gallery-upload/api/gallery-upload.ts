import "server-only";

import {revalidateTag} from "next/cache";

import type {GuestSessionPublicErrorCode} from "@features/guest-session";
import {validateGuestSessionFromRequest} from "@features/guest-session/server";
import {GALLERY_PHOTOS_LIST_CACHE_TAG} from "@features/gallery-list";
import {createServerClient} from "@shared/api/supabase/server";
import {assertR2UploadConfig, createPresignedPhotoPutUrl} from "@shared/api/r2";

import {loadRsvpDisplayNameForUpload} from "../lib/load-rsvp-display-name-for-upload";
import {uploadSessionErrorCode} from "../lib/upload-session-error-code";
import {parseGalleryConfirmPayload} from "../lib/validate-confirm-payload";
import {parseGalleryPresignPayload} from "../lib/validate-presign-payload";
import {persistPhotoRow} from "../lib/persist-photo-row";

export type PresignGalleryUploadResult =
    | {ok: true; url: string; key: string}
    | {
          ok: false;
          kind: "validation";
          fieldErrors: Record<string, string[] | undefined>;
          formErrors: string[];
      }
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "r2"; message: string}
    | {ok: false; kind: "no_session"; code: GuestSessionPublicErrorCode};

export type ConfirmGalleryUploadResult =
    | {ok: true; publicUrl: string}
    | {
          ok: false;
          kind: "validation";
          fieldErrors: Record<string, string[] | undefined>;
          formErrors: string[];
      }
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "no_session"; code: GuestSessionPublicErrorCode};

/**
 * Validates body, then returns a presigned PUT URL and object key for R2.
 * Requires a valid guest session cookie (plan: gallery uploads bound to RSVP).
 */
export async function presignGalleryUpload(
    rawBody: unknown,
    request: Request,
): Promise<PresignGalleryUploadResult> {
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

    const parsed = parseGalleryPresignPayload(rawBody);
    if (!parsed.ok) {
        const flat = parsed.error.flatten();
        return {
            ok: false,
            kind: "validation",
            fieldErrors: flat.fieldErrors,
            formErrors: flat.formErrors,
        };
    }

    try {
        const {url, key} = await createPresignedPhotoPutUrl(
            parsed.data.contentType,
        );
        return {ok: true, url, key};
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (
            message.includes("R2:") ||
            message.includes("R2_ACCOUNT") ||
            message.includes("R2_PUBLIC_URL")
        ) {
            return {ok: false, kind: "config", message};
        }
        return {ok: false, kind: "r2", message};
    }
}

/**
 * After the browser PUTs to R2, records metadata in `photos` with `rsvp_id` from the guest session.
 */
export async function confirmGalleryUpload(
    rawBody: unknown,
    request: Request,
): Promise<ConfirmGalleryUploadResult> {
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
    const nameResult = await loadRsvpDisplayNameForUpload(supabase, rsvpId);
    if (!nameResult.ok) {
        return {ok: false, kind: "database", message: nameResult.message};
    }

    const parsed = parseGalleryConfirmPayload(rawBody);
    if (!parsed.ok) {
        const flat = parsed.error.flatten();
        return {
            ok: false,
            kind: "validation",
            fieldErrors: flat.fieldErrors,
            formErrors: flat.formErrors,
        };
    }

    let publicUrlBase: string;
    try {
        ({publicUrlBase} = assertR2UploadConfig());
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {key, sizeBytes} = parsed.data;
    const publicUrl = `${publicUrlBase}/${key}`;

    const saved = await persistPhotoRow(supabase, {
        r2Key: key,
        uploaderName: nameResult.name,
        publicUrl,
        sizeBytes,
        rsvpId,
    });

    if (!saved.ok) {
        return {ok: false, kind: "database", message: saved.message};
    }

    revalidateTag(GALLERY_PHOTOS_LIST_CACHE_TAG, "max");

    return {ok: true, publicUrl: saved.publicUrl};
}
