import "server-only";

import type {PhotoDbRow} from "@entities/photo";
import {createServerClient} from "@shared/api/supabase/server";

export type AdminPhotoRow = {
    id: string;
    publicUrl: string;
    uploaderName: string | null;
    uploadedAt: string;
    rsvpId: string | null;
};

export type ListPhotosForAdminOptions = Readonly<{
    limit?: number;
    offset?: number;
}>;

export type ListPhotosForAdminResult =
    | { ok: true; photos: AdminPhotoRow[]; hasMore: boolean }
    | { ok: false; kind: "config" | "database"; message: string };

function mapRow(row: PhotoDbRow): AdminPhotoRow {
    return {
        id: row.id,
        publicUrl: row.public_url,
        uploaderName: row.uploader_name,
        uploadedAt: row.uploaded_at,
        rsvpId: row.rsvp_id ?? null,
    };
}

/**
 * Lists gallery photos for the admin UI (service role, `uploaded_at` desc).
 * Does not check guest-facing feature flags — use only behind admin auth.
 */
export async function listPhotosForAdmin(
    options?: ListPhotosForAdminOptions,
): Promise<ListPhotosForAdminResult> {
    const limit = options?.limit ?? 48;
    const offset = options?.offset ?? 0;

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
        photos: pageRows.map(mapRow),
        hasMore,
    };
}
