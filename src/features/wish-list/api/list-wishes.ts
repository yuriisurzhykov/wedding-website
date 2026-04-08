import "server-only";

import {createServerClient} from "@shared/api/supabase/server";
import {mapWishRowToView, type WishDbRow, type WishView} from "@entities/wish";

export type ListWishesResult =
    | {ok: true; wishes: WishView[]}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "database"; message: string};

/**
 * Loads recent wishes for the home page (service-role read).
 */
export async function listWishes(limit = 50): Promise<ListWishesResult> {
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
        .limit(limit);

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    const rows = (data ?? []) as WishDbRow[];
    return {ok: true, wishes: rows.map(mapWishRowToView)};
}
