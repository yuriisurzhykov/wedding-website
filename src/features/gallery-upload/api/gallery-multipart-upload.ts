import "server-only";

import {revalidateTag} from "next/cache";
import {z} from "zod";

import type {GuestSessionPublicErrorCode} from "@features/guest-session";
import {validateGuestSessionFromRequest} from "@features/guest-session/server";
import {GALLERY_PHOTOS_LIST_CACHE_TAG} from "@features/gallery-list";
import {getSiteSettingsCached} from "@features/site-settings";
import {GALLERY_ALLOWED_CONTENT_TYPES, GALLERY_MAX_FILE_BYTES,} from "@entities/photo";
import {createServerClient} from "@shared/api/supabase/server";
import {resolveGalleryImageContentType} from "@shared/lib/gallery-image-content-type";

import type {UploadMediaPurpose} from "../lib/assert-upload-celebration-policy";
import {assertUploadCelebrationPolicy} from "../lib/assert-upload-celebration-policy";
import {loadRsvpIdentityForUpload} from "../lib/load-rsvp-identity-for-upload";
import {persistPhotoRow} from "../lib/persist-photo-row";
import {putGalleryPhotoToR2} from "../lib/put-photo-to-r2";
import {uploadSessionErrorCode} from "../lib/upload-session-error-code";

const contentTypeSchema = z.enum(GALLERY_ALLOWED_CONTENT_TYPES);

export type MultipartGalleryUploadResult =
    | { ok: true; key: string; publicUrl: string }
    | {
    ok: false;
    kind: "validation";
    message: string;
}
    | { ok: false; kind: "config"; message: string }
    | { ok: false; kind: "r2"; message: string }
    | { ok: false; kind: "database"; message: string }
    | { ok: false; kind: "no_session"; code: GuestSessionPublicErrorCode }
    | { ok: false; kind: "celebration_closed" }
    | { ok: false; kind: "feature_disabled" };

function validationError(message: string): MultipartGalleryUploadResult {
    return {ok: false, kind: "validation", message};
}

/**
 * Accepts `multipart/form-data` with `file` (image). Requires a guest session; `uploader_name`
 * and `photos.rsvp_id` come from RSVP. Uploads to R2 from the server — no browser→R2 CORS.
 */
export async function uploadGalleryPhotoFromMultipart(
    request: Request,
): Promise<MultipartGalleryUploadResult> {
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
    const identity = await loadRsvpIdentityForUpload(supabase, rsvpId);
    if (!identity.ok) {
        return {ok: false, kind: "database", message: identity.message};
    }

    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return validationError("Invalid multipart body");
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
        return validationError("Expected file field");
    }

    const purposeRaw = formData.get("purpose");
    const purpose: UploadMediaPurpose =
        purposeRaw === "wish" ? "wish" : "gallery";

    const siteSettings = await getSiteSettingsCached();
    if (purpose === "gallery" && !siteSettings.capabilities.galleryUpload) {
        return {ok: false, kind: "feature_disabled"};
    }
    if (purpose === "wish" && !siteSettings.capabilities.wishPhotoAttach) {
        return {ok: false, kind: "feature_disabled"};
    }

    const policy = assertUploadCelebrationPolicy(purpose, identity.attending);
    if (!policy.ok) {
        return {ok: false, kind: "celebration_closed"};
    }

    const fromBrowser = contentTypeSchema.safeParse(file.type);
    const inferred = resolveGalleryImageContentType(file);
    const contentType = fromBrowser.success ? fromBrowser.data : inferred;
    if (!contentType) {
        return validationError("Unsupported file type");
    }

    if (file.size <= 0 || file.size > GALLERY_MAX_FILE_BYTES) {
        return validationError("Invalid file size");
    }

    let buffer: Buffer;
    try {
        buffer = Buffer.from(await file.arrayBuffer());
    } catch {
        return validationError("Could not read file");
    }

    if (buffer.length !== file.size) {
        return validationError("File size mismatch");
    }

    let uploaded: { key: string; publicUrl: string };
    try {
        uploaded = await putGalleryPhotoToR2({contentType, body: buffer});
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

    const saved = await persistPhotoRow(supabase, {
        r2Key: uploaded.key,
        uploaderName: identity.name,
        publicUrl: uploaded.publicUrl,
        sizeBytes: file.size,
        rsvpId,
    });

    if (!saved.ok) {
        return {ok: false, kind: "database", message: saved.message};
    }

    revalidateTag(GALLERY_PHOTOS_LIST_CACHE_TAG, "max");

    return {
        ok: true,
        key: uploaded.key,
        publicUrl: uploaded.publicUrl,
    };
}
