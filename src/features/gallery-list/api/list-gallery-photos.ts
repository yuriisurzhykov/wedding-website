import "server-only";

import {isFeatureEnabled} from "@entities/site-settings";
import {createServerClient} from "@shared/api/supabase/server";
import {type GalleryPhotoView, mapPhotoRowToGalleryView, type PhotoDbRow} from "@entities/photo";
import {getSiteSettingsCached} from "@features/site-settings";

export type ListGalleryPhotosOptions = {
    /** Page size (max rows returned). */
    limit?: number;
    /** Zero-based offset in the `uploaded_at` desc ordering. */
    offset?: number;
    /** When set (guest session), each row includes `canDelete` if it belongs to this guest account. */
    viewerGuestAccountId?: string | null;
};

export type ListGalleryPhotosResult =
    | { ok: true; photos: GalleryPhotoView[]; hasMore: boolean }
    | { ok: false; kind: "config"; message: string }
    | { ok: false; kind: "database"; message: string };

/**
 * Loads public photos (service-role read). Fetches `limit + 1` rows to set `hasMore` without a separate count.
 */
export async function listGalleryPhotos(
    options?: ListGalleryPhotosOptions,
): Promise<ListGalleryPhotosResult> {
    const limit = options?.limit ?? 48;
    const offset = options?.offset ?? 0;
    const viewerGuestAccountId = options?.viewerGuestAccountId;

    const siteSettings = await getSiteSettingsCached();
    if (!isFeatureEnabled(siteSettings.capabilities.galleryBrowse)) {
        return {ok: true, photos: [], hasMore: false};
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
        .select("*")
        .order("uploaded_at", {ascending: false})
        .range(offset, offset + limit);

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    const rows = (data ?? []) as PhotoDbRow[];
    const hasMore = rows.length > limit;
    const pageRows = rows.slice(0, limit);
    return {
        ok: true,
        photos: pageRows.map((row) =>
            mapPhotoRowToGalleryView(row, viewerGuestAccountId),
        ),
        hasMore,
    };
}
