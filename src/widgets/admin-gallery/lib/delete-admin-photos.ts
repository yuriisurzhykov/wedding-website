export type DeleteAdminPhotosResult =
    | { ok: true; deleted: number }
    | { ok: false; status: number; data: unknown };

/**
 * Calls `DELETE /api/admin/photos` with the given photo ids (session cookie or legacy token).
 */
export async function deleteAdminPhotos(
    ids: string[],
): Promise<DeleteAdminPhotosResult> {
    const res = await fetch("/api/admin/photos", {
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
