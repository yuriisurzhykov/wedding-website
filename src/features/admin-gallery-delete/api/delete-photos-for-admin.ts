import "server-only";

import {revalidateTag} from "next/cache";

import {GALLERY_PHOTOS_LIST_CACHE_TAG} from "@features/gallery-list";
import {deleteR2Object} from "@shared/api/r2";
import {createServerClient} from "@shared/api/supabase/server";

import {parseDeletePhotosPayload} from "../lib/validate-delete-photos-payload";

export type DeletePhotosForAdminResult =
    | { ok: true; deleted: number }
    | {
          ok: false;
          kind: "validation";
          fieldErrors: Record<string, string[] | undefined>;
          formErrors: string[];
      }
    | { ok: false; kind: "config" | "database"; message: string };

/**
 * Deletes photos by id (admin). Does not require `rsvp_id` match.
 * Removes DB rows first, revalidates gallery cache, then deletes R2 objects (logs R2 failures).
 */
export async function deletePhotosForAdmin(
    rawBody: unknown,
): Promise<DeletePhotosForAdminResult> {
    const parsed = parseDeletePhotosPayload(rawBody);
    if (!parsed.success) {
        const flat = parsed.error.flatten();
        return {
            ok: false,
            kind: "validation",
            fieldErrors: flat.fieldErrors,
            formErrors: flat.formErrors,
        };
    }

    const {ids} = parsed.data;

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data: deletedRows, error: deleteError} = await supabase
        .from("photos")
        .delete()
        .in("id", ids)
        .select("r2_key");

    if (deleteError) {
        return {ok: false, kind: "database", message: deleteError.message};
    }

    const rows = deletedRows ?? [];
    if (rows.length > 0) {
        revalidateTag(GALLERY_PHOTOS_LIST_CACHE_TAG, "max");
    }

    for (const row of rows) {
        const r2Key = row.r2_key as string;
        const r2Result = await deleteR2Object(r2Key);
        if (!r2Result.ok) {
            console.error(
                "[admin-gallery-delete] R2 delete failed after DB row removed",
                r2Key,
                r2Result.message,
            );
        }
    }

    return {ok: true, deleted: rows.length};
}
