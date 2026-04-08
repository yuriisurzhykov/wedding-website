import "server-only";

import {createServerClient} from "@shared/api/supabase/server";
import {assertR2UploadConfig, createPresignedPhotoPutUrl} from "@shared/api/r2";

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
    | {ok: false; kind: "r2"; message: string};

export type ConfirmGalleryUploadResult =
    | {ok: true; publicUrl: string}
    | {
          ok: false;
          kind: "validation";
          fieldErrors: Record<string, string[] | undefined>;
          formErrors: string[];
      }
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "database"; message: string};

/**
 * Validates body, then returns a presigned PUT URL and object key for R2.
 */
export async function presignGalleryUpload(
    rawBody: unknown,
): Promise<PresignGalleryUploadResult> {
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
 * After the browser PUTs to R2, records metadata in `photos`.
 */
export async function confirmGalleryUpload(
    rawBody: unknown,
): Promise<ConfirmGalleryUploadResult> {
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

    const {key, uploaderName, sizeBytes} = parsed.data;
    const publicUrl = `${publicUrlBase}/${key}`;

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const saved = await persistPhotoRow(supabase, {
        r2Key: key,
        uploaderName,
        publicUrl,
        sizeBytes,
    });

    if (!saved.ok) {
        return {ok: false, kind: "database", message: saved.message};
    }

    return {ok: true, publicUrl: saved.publicUrl};
}
