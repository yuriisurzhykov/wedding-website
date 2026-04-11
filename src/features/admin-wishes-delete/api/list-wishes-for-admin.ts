import "server-only";

import type {WishDbRow} from "@entities/wish";
import {createServerClient} from "@shared/api/supabase/server";

export type AdminWishRow = {
    id: string;
    authorName: string;
    message: string;
    photoUrl: string | null;
    createdAt: string;
};

export type ListWishesForAdminOptions = Readonly<{
    limit?: number;
    offset?: number;
}>;

export type ListWishesForAdminResult =
    | { ok: true; wishes: AdminWishRow[]; hasMore: boolean }
    | { ok: false; kind: "config" | "database"; message: string };

function mapRow(row: WishDbRow): AdminWishRow {
    return {
        id: row.id,
        authorName: row.author_name,
        message: row.message,
        photoUrl: row.photo_url,
        createdAt: row.created_at,
    };
}

/**
 * Lists wishes for the admin UI (service role, `created_at` desc).
 * Does not check guest-facing feature flags — use only behind admin auth.
 */
export async function listWishesForAdmin(
    options?: ListWishesForAdminOptions,
): Promise<ListWishesForAdminResult> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await supabase
        .from("wishes")
        .select("*")
        .order("created_at", {ascending: false})
        .range(offset, offset + limit);

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    const rows = (data ?? []) as WishDbRow[];
    const hasMore = rows.length > limit;
    const pageRows = rows.slice(0, limit);
    return {
        ok: true,
        wishes: pageRows.map(mapRow),
        hasMore,
    };
}
