import "server-only";

import {isFeatureEnabled} from "@entities/site-settings";
import {getR2Object} from "@shared/api/r2";
import {createServerClient} from "@shared/api/supabase/server";
import {getSiteSettingsCached} from "@features/site-settings";

export type GetGalleryPhotoDownloadResult =
    | { ok: true; bytes: Uint8Array; contentType: string; filename: string }
    | { ok: false; kind: "disabled" }
    | { ok: false; kind: "not_found" }
    | { ok: false; kind: "config"; message: string }
    | { ok: false; kind: "database"; message: string }
    | { ok: false; kind: "storage"; message: string };

/** File extension from an R2 key like `photos/<uuid>.jpg` (lowercased, alnum only). */
function extensionFromKey(key: string): string {
    const dot = key.lastIndexOf(".");
    if (dot === -1) {
        return "jpg";
    }
    const ext = key.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "");
    return ext || "jpg";
}

/**
 * Loads a gallery photo's bytes for a same-origin download.
 *
 * Gated on `galleryBrowse`; looks the row up by `id` to resolve its private R2 key
 * (never trusting a client-supplied key) and returns the object plus a friendly
 * `wedding-photo-<id8>.<ext>` filename for `Content-Disposition`.
 */
export async function getGalleryPhotoDownload(
    photoId: string,
): Promise<GetGalleryPhotoDownloadResult> {
    const siteSettings = await getSiteSettingsCached();
    if (!isFeatureEnabled(siteSettings.capabilities.galleryBrowse)) {
        return {ok: false, kind: "disabled"};
    }

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await supabase
        .from("photos")
        .select("id, r2_key")
        .eq("id", photoId)
        .maybeSingle();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }
    if (!data) {
        return {ok: false, kind: "not_found"};
    }

    const r2Key = data.r2_key as string;
    const object = await getR2Object(r2Key);

    if (!object.ok) {
        if (object.kind === "not_found") {
            return {ok: false, kind: "not_found"};
        }
        if (object.kind === "config") {
            return {ok: false, kind: "config", message: object.message};
        }
        return {ok: false, kind: "storage", message: object.message};
    }

    const ext = extensionFromKey(r2Key);
    const filename = `wedding-photo-${String(data.id).slice(0, 8)}.${ext}`;

    return {
        ok: true,
        bytes: object.bytes,
        contentType: object.contentType,
        filename,
    };
}
