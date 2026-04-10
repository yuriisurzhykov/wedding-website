import "server-only";

import type {RsvpRowInsert} from "@entities/rsvp";
import type {SupabaseClient} from "@supabase/supabase-js";

export type PersistRsvpRowResult =
    | { ok: true; id: string }
    | { ok: false; message: string; code?: string };

async function selectIdByEq(
    supabase: SupabaseClient,
    column: "email" | "phone",
    value: string,
): Promise<{ ok: true; id: string | null } | { ok: false; message: string }> {
    const {data, error} = await supabase
        .from("rsvp")
        .select("id")
        .eq(column, value)
        .maybeSingle();

    if (error) {
        return {ok: false, message: error.message};
    }
    const id = data?.id;
    return {ok: true, id: typeof id === "string" ? id : null};
}

async function updateRow(
    supabase: SupabaseClient,
    id: string,
    row: RsvpRowInsert,
): Promise<PersistRsvpRowResult> {
    const {data, error} = await supabase
        .from("rsvp")
        .update(row)
        .eq("id", id)
        .select("id")
        .single();

    if (error) {
        return {ok: false, message: error.message};
    }
    const out = data?.id;
    if (typeof out !== "string") {
        return {ok: false, message: "Update succeeded but no id was returned"};
    }
    return {ok: true, id: out};
}

async function insertRow(
    supabase: SupabaseClient,
    row: RsvpRowInsert,
): Promise<PersistRsvpRowResult> {
    const {data, error} = await supabase
        .from("rsvp")
        .insert(row)
        .select("id")
        .single();

    if (error) {
        return {ok: false, message: error.message, code: error.code};
    }
    const id = data?.id;
    if (typeof id !== "string") {
        return {ok: false, message: "Insert succeeded but no id was returned"};
    }
    return {ok: true, id};
}

/**
 * Saves an RSVP row with **at most one row per non-null email** and **at most one per non-null phone**
 * (enforced by partial unique indexes on `rsvp`).
 *
 * Resolution: match by `email` first, then by `phone`. If two different rows match (legacy data),
 * the phone-only row is removed and the email-matched row is updated with the new payload.
 *
 * @param supabase — Service-role client (bypasses RLS).
 */
export async function persistRsvpRow(
    supabase: SupabaseClient,
    row: RsvpRowInsert,
): Promise<PersistRsvpRowResult> {
    let idEmail: string | null = null;
    if (row.email) {
        const r = await selectIdByEq(supabase, "email", row.email);
        if (!r.ok) {
            return r;
        }
        idEmail = r.id;
    }

    let idPhone: string | null = null;
    if (row.phone) {
        const r = await selectIdByEq(supabase, "phone", row.phone);
        if (!r.ok) {
            return r;
        }
        idPhone = r.id;
    }

    if (idEmail && idPhone && idEmail !== idPhone) {
        const {error} = await supabase.from("rsvp").delete().eq("id", idPhone);
        if (error) {
            return {ok: false, message: error.message};
        }
        return updateRow(supabase, idEmail, row);
    }

    const id = idEmail ?? idPhone;
    if (id) {
        return updateRow(supabase, id, row);
    }

    const inserted = await insertRow(supabase, row);
    if (inserted.ok) {
        return inserted;
    }
    if (inserted.code !== "23505") {
        return inserted;
    }

    let rivalId: string | null = null;
    if (row.email) {
        const r = await selectIdByEq(supabase, "email", row.email);
        if (!r.ok) {
            return r;
        }
        rivalId = r.id;
    }
    if (!rivalId && row.phone) {
        const r = await selectIdByEq(supabase, "phone", row.phone);
        if (!r.ok) {
            return r;
        }
        rivalId = r.id;
    }
    if (rivalId) {
        return updateRow(supabase, rivalId, row);
    }
    return inserted;
}
