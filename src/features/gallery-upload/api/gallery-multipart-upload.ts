import "server-only";

import {z} from "zod";

import {GALLERY_ALLOWED_CONTENT_TYPES, GALLERY_MAX_FILE_BYTES,} from "@entities/photo";
import {createServerClient} from "@shared/api/supabase/server";

import {persistPhotoRow} from "../lib/persist-photo-row";
import {putGalleryPhotoToR2} from "../lib/put-photo-to-r2";

const uploaderNameSchema = z.string().trim().min(1).max(100);

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
    | { ok: false; kind: "database"; message: string };

function validationError(message: string): MultipartGalleryUploadResult {
    return {ok: false, kind: "validation", message};
}

/**
 * Accepts `multipart/form-data` with `file` (image) and `uploaderName`. Uploads to R2 from the
 * server and inserts `photos` — no browser→R2 CORS.
 */
export async function uploadGalleryPhotoFromMultipart(
    request: Request,
): Promise<MultipartGalleryUploadResult> {
    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return validationError("Invalid multipart body");
    }

    const file = formData.get("file");
    const uploaderNameRaw = formData.get("uploaderName");

    if (!(file instanceof File)) {
        return validationError("Expected file field");
    }

    const nameParsed = uploaderNameSchema.safeParse(
        typeof uploaderNameRaw === "string" ? uploaderNameRaw : "",
    );
    if (!nameParsed.success) {
        return validationError("Invalid uploader name");
    }
    const uploaderName = nameParsed.data;

    const typeParsed = contentTypeSchema.safeParse(file.type);
    if (!typeParsed.success) {
        return validationError("Unsupported file type");
    }
    const contentType = typeParsed.data;

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

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const saved = await persistPhotoRow(supabase, {
        r2Key: uploaded.key,
        uploaderName,
        publicUrl: uploaded.publicUrl,
        sizeBytes: file.size,
    });

    if (!saved.ok) {
        return {ok: false, kind: "database", message: saved.message};
    }

    return {
        ok: true,
        key: uploaded.key,
        publicUrl: uploaded.publicUrl,
    };
}
