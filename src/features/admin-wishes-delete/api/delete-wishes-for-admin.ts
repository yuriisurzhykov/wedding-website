import "server-only";

import {deleteR2Object} from "@shared/api/r2";
import {createServerClient} from "@shared/api/supabase/server";

import {parseDeleteWishesPayload} from "../lib/validate-delete-wishes-payload";

export type DeleteWishesForAdminResult =
    | { ok: true; deleted: number }
    | {
          ok: false;
          kind: "validation";
          fieldErrors: Record<string, string[] | undefined>;
          formErrors: string[];
      }
    | { ok: false; kind: "config" | "database"; message: string };

/**
 * Deletes wishes by id (admin). Removes DB rows first, then best-effort R2 delete when `photo_r2_key` is set.
 */
export async function deleteWishesForAdmin(
    rawBody: unknown,
): Promise<DeleteWishesForAdminResult> {
    const parsed = parseDeleteWishesPayload(rawBody);
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
        .from("wishes")
        .delete()
        .in("id", ids)
        .select("photo_r2_key");

    if (deleteError) {
        return {ok: false, kind: "database", message: deleteError.message};
    }

    const rows = deletedRows ?? [];

    for (const row of rows) {
        const key = row.photo_r2_key as string | null;
        if (!key) {
            continue;
        }
        const r2Result = await deleteR2Object(key);
        if (!r2Result.ok) {
            console.error(
                "[admin-wishes-delete] R2 delete failed after DB row removed",
                key,
                r2Result.message,
            );
        }
    }

    return {ok: true, deleted: rows.length};
}
