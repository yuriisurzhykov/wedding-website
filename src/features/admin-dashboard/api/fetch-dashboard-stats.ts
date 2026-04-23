import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

import {createServerClient} from "@shared/api/supabase/server";

export type DashboardStats = {
    rsvp: {
        total: number;
        attending: number;
        declined: number;
        totalGuests: number;
    };
    accounts: {
        total: number;
        onlineNow: number;
    };
    wishes: {total: number};
    gallery: {
        totalPhotos: number;
        totalSizeBytes: number;
    };
    mail: {
        unread: number;
        totalInbound: number;
    };
    allergies: Array<{
        rsvpName: string;
        dietary: string;
    }>;
    /** Heuristic problems for the admin alerts panel (sessions / email windows; RSVP row is current snapshot). */
    alerts: {
        /** `attending` true but `guest_count` is 0 (data inconsistency). */
        rsvpAttendingZeroGuests: number;
        sessionsExpiredLast24h: number;
        sessionsExpiredLast7d: number;
        emailsFailedLast24h: number;
        emailsFailedLast7d: number;
    };
};

export type FetchDashboardStatsResult =
    | {ok: true; stats: DashboardStats}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "database"; message: string};

const ONLINE_WINDOW_MS = 15 * 60 * 1000;
const MS_24H = 24 * 60 * 60 * 1000;
const MS_7D = 7 * MS_24H;
/** PostgREST aggregate selects (`col.sum()`) require `pgrst.db_aggregates_enabled`; we sum in JS instead. */
const NUMERIC_SUM_PAGE = 1000;

function addFiniteInt(acc: number, raw: unknown): number {
    if (typeof raw === "number" && Number.isFinite(raw)) {
        return acc + Math.trunc(raw);
    }
    if (typeof raw === "string" && raw.trim() !== "") {
        const n = Number(raw);
        return Number.isFinite(n) ? acc + Math.trunc(n) : acc;
    }
    return acc;
}

async function sumAttendingGuestCounts(
    supabase: SupabaseClient,
): Promise<{ok: true; sum: number} | {ok: false; message: string}> {
    let total = 0;
    let from = 0;
    for (;;) {
        const {data, error} = await supabase
            .from("rsvp")
            .select("guest_count")
            .eq("attending", true)
            .range(from, from + NUMERIC_SUM_PAGE - 1);
        if (error) {
            return {ok: false, message: error.message};
        }
        if (!data?.length) {
            break;
        }
        for (const row of data) {
            total = addFiniteInt(total, row.guest_count);
        }
        if (data.length < NUMERIC_SUM_PAGE) {
            break;
        }
        from += NUMERIC_SUM_PAGE;
    }
    return {ok: true, sum: total};
}

async function sumPhotosSizeBytes(
    supabase: SupabaseClient,
): Promise<{ok: true; sum: number} | {ok: false; message: string}> {
    let total = 0;
    let from = 0;
    for (;;) {
        const {data, error} = await supabase
            .from("photos")
            .select("size_bytes")
            .range(from, from + NUMERIC_SUM_PAGE - 1);
        if (error) {
            return {ok: false, message: error.message};
        }
        if (!data?.length) {
            break;
        }
        for (const row of data) {
            total = addFiniteInt(total, row.size_bytes);
        }
        if (data.length < NUMERIC_SUM_PAGE) {
            break;
        }
        from += NUMERIC_SUM_PAGE;
    }
    return {ok: true, sum: total};
}

function firstDbMessage(
    results: ReadonlyArray<{error: {message: string} | null}>,
): string | null {
    for (const r of results) {
        if (r.error) {
            return r.error.message;
        }
    }
    return null;
}

/**
 * Loads admin dashboard KPIs in parallel via the Supabase service-role client.
 *
 * @returns `{ ok: true, stats }` on success, or `{ ok: false, kind, message }` when env is missing or any query fails.
 */
export async function fetchDashboardStats(): Promise<FetchDashboardStatsResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const onlineSinceIso = new Date(now - ONLINE_WINDOW_MS).toISOString();
    const expiredSince24hIso = new Date(now - MS_24H).toISOString();
    const expiredSince7dIso = new Date(now - MS_7D).toISOString();

    const [
        rsvpTotal,
        rsvpAttending,
        rsvpDeclined,
        guestAccountsTotal,
        sessionsOnline,
        wishesTotal,
        photosTotal,
        inboundUnread,
        inboundTotal,
        allergiesRows,
        rsvpAttendingZeroGuests,
        sessionsExpired24h,
        sessionsExpired7d,
        emailsFailed24h,
        emailsFailed7d,
        guestCountSum,
        photosSizeSum,
    ] = await Promise.all([
        supabase.from("rsvp").select("*", {count: "exact", head: true}),
        supabase.from("rsvp").select("*", {count: "exact", head: true}).eq("attending", true),
        supabase.from("rsvp").select("*", {count: "exact", head: true}).eq("attending", false),
        supabase.from("guest_accounts").select("*", {count: "exact", head: true}),
        supabase
            .from("guest_sessions")
            .select("*", {count: "exact", head: true})
            .gt("expires_at", nowIso)
            .gte("last_seen_at", onlineSinceIso),
        supabase.from("wishes").select("*", {count: "exact", head: true}),
        supabase.from("photos").select("*", {count: "exact", head: true}),
        supabase
            .from("inbound_emails")
            .select("*", {count: "exact", head: true})
            .eq("status", "unread"),
        supabase.from("inbound_emails").select("*", {count: "exact", head: true}),
        supabase.from("rsvp").select("name, dietary").not("dietary", "is", null).order("name"),
        supabase
            .from("rsvp")
            .select("*", {count: "exact", head: true})
            .eq("attending", true)
            .eq("guest_count", 0),
        supabase
            .from("guest_sessions")
            .select("*", {count: "exact", head: true})
            .lte("expires_at", nowIso)
            .gte("expires_at", expiredSince24hIso),
        supabase
            .from("guest_sessions")
            .select("*", {count: "exact", head: true})
            .lte("expires_at", nowIso)
            .gte("expires_at", expiredSince7dIso),
        supabase
            .from("email_send_log")
            .select("*", {count: "exact", head: true})
            .eq("status", "failed")
            .gte("created_at", expiredSince24hIso),
        supabase
            .from("email_send_log")
            .select("*", {count: "exact", head: true})
            .eq("status", "failed")
            .gte("created_at", expiredSince7dIso),
        sumAttendingGuestCounts(supabase),
        sumPhotosSizeBytes(supabase),
    ]);

    const errMsg =
        firstDbMessage([
            rsvpTotal,
            rsvpAttending,
            rsvpDeclined,
            guestAccountsTotal,
            sessionsOnline,
            wishesTotal,
            photosTotal,
            inboundUnread,
            inboundTotal,
            allergiesRows,
            rsvpAttendingZeroGuests,
            sessionsExpired24h,
            sessionsExpired7d,
            emailsFailed24h,
            emailsFailed7d,
        ]) ??
        (!guestCountSum.ok ? guestCountSum.message : null) ??
        (!photosSizeSum.ok ? photosSizeSum.message : null);
    if (errMsg) {
        return {ok: false, kind: "database", message: errMsg};
    }
    if (!guestCountSum.ok) {
        return {ok: false, kind: "database", message: guestCountSum.message};
    }
    if (!photosSizeSum.ok) {
        return {ok: false, kind: "database", message: photosSizeSum.message};
    }

    const allergies =
        (allergiesRows.data ?? [])
            .map((r) => {
                const note = typeof r.dietary === "string" ? r.dietary.trim() : "";
                const name = typeof r.name === "string" ? r.name.trim() : "";
                return note.length > 0 ? {rsvpName: name, dietary: note} : null;
            })
            .filter((x): x is {rsvpName: string; dietary: string} => x !== null);

    const stats: DashboardStats = {
        rsvp: {
            total: rsvpTotal.count ?? 0,
            attending: rsvpAttending.count ?? 0,
            declined: rsvpDeclined.count ?? 0,
            totalGuests: guestCountSum.sum,
        },
        accounts: {
            total: guestAccountsTotal.count ?? 0,
            onlineNow: sessionsOnline.count ?? 0,
        },
        wishes: {total: wishesTotal.count ?? 0},
        gallery: {
            totalPhotos: photosTotal.count ?? 0,
            totalSizeBytes: photosSizeSum.sum,
        },
        mail: {
            unread: inboundUnread.count ?? 0,
            totalInbound: inboundTotal.count ?? 0,
        },
        allergies,
        alerts: {
            rsvpAttendingZeroGuests: rsvpAttendingZeroGuests.count ?? 0,
            sessionsExpiredLast24h: sessionsExpired24h.count ?? 0,
            sessionsExpiredLast7d: sessionsExpired7d.count ?? 0,
            emailsFailedLast24h: emailsFailed24h.count ?? 0,
            emailsFailedLast7d: emailsFailed7d.count ?? 0,
        },
    };

    return {ok: true, stats};
}
