import "server-only";

import {createServerClient} from "@shared/api/supabase/server";
import {mapPhotoRowToGalleryView, type GalleryPhotoView, type PhotoDbRow} from "@entities/photo";

export type ListGalleryPhotosResult =
    | {ok: true; photos: GalleryPhotoView[]}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "database"; message: string};

/**
 * Loads recent public photos for the home gallery (service-role read).
 */
export async function listGalleryPhotos(
    limit = 48,
): Promise<ListGalleryPhotosResult> {
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
        .limit(limit);

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    const rows = (data ?? []) as PhotoDbRow[];
    return {
        ok: true,
        photos: rows.map(mapPhotoRowToGalleryView),
    };
}
