import "server-only";

import {createServerClient} from "@shared/api/supabase/server";

export type CountWishesResult =
    | { ok: true; total: number }
    | { ok: false; kind: "config"; message: string }
    | { ok: false; kind: "database"; message: string };

/**
 * Exact row count for `wishes` (service-role). Use for SSR copy such as “all (N)” without paginating the table.
 */
export async function countWishes(): Promise<CountWishesResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {count, error} = await supabase
        .from("wishes")
        .select("*", {count: "exact", head: true});

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    return {ok: true, total: count ?? 0};
}
