export type DeleteAdminWishesResult =
    | { ok: true; deleted: number }
    | { ok: false; status: number; data: unknown };

/**
 * Calls `DELETE /api/admin/wishes` with the given wish ids (session cookie or legacy token).
 */
export async function deleteAdminWishes(
    ids: string[],
): Promise<DeleteAdminWishesResult> {
    const res = await fetch("/api/admin/wishes", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ids}),
    });

    const data: unknown = await res.json().catch(() => null);

    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }

    let deleted = 0;
    if (
        typeof data === "object" &&
        data !== null &&
        "deleted" in data &&
        typeof (data as {deleted: unknown}).deleted === "number"
    ) {
        deleted = (data as {deleted: number}).deleted;
    }

    return {ok: true, deleted};
}
