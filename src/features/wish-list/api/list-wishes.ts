import "server-only";

import {isFeatureEnabled} from "@entities/site-settings";
import {createServerClient} from "@shared/api/supabase/server";
import {mapWishRowToView, type WishDbRow, type WishView} from "@entities/wish";
import {getSiteSettingsCached} from "@features/site-settings";

export type ListWishesOptions = {
    /** Page size (max rows returned). */
    limit?: number;
    /** Zero-based offset in the `created_at` desc ordering. */
    offset?: number;
};

export type ListWishesResult =
    | { ok: true; wishes: WishView[]; hasMore: boolean }
    | { ok: false; kind: "config"; message: string }
    | { ok: false; kind: "database"; message: string };

/**
 * Loads wishes (service-role read). Fetches `limit + 1` rows to set `hasMore` without a separate count.
 */
export async function listWishes(
    options?: ListWishesOptions,
): Promise<ListWishesResult> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const siteSettings = await getSiteSettingsCached();
    if (!isFeatureEnabled(siteSettings.capabilities.wishSubmit)) {
        return {ok: true, wishes: [], hasMore: false};
    }

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
    return {ok: true, wishes: pageRows.map(mapWishRowToView), hasMore};
}
