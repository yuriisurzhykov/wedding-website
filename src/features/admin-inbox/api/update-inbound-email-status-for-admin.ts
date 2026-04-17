import "server-only";

import type {EmailStatus} from "@entities/inbound-email";
import {createServerClient} from "@shared/api/supabase/server";

import {inboundEmailStatusPatchBodySchema, type InboundEmailStatusUpdate,} from "@features/admin-inbox";

export type UpdateInboundEmailStatusForAdminResult =
    | { ok: true; status: EmailStatus }
    | {
    ok: false;
    kind: "validation";
    fieldErrors: Record<string, string[] | undefined>;
    formErrors: string[];
}
    | { ok: false; kind: "database"; message: string }
    | { ok: false; kind: "config"; message: string }
    | { ok: false; kind: "not_found" };

/**
 * Updates `inbound_emails.status` (read / unread / archived).
 */
export async function updateInboundEmailStatusForAdmin(
    id: string,
    rawBody: unknown,
): Promise<UpdateInboundEmailStatusForAdminResult> {
    const parsed = inboundEmailStatusPatchBodySchema.safeParse(rawBody);
    if (!parsed.success) {
        const flat = parsed.error.flatten();
        return {
            ok: false,
            kind: "validation",
            fieldErrors: flat.fieldErrors,
            formErrors: flat.formErrors,
        };
    }

    const status: InboundEmailStatusUpdate = parsed.data.status;

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await supabase
        .from("inbound_emails")
        .update({status})
        .eq("id", id)
        .select("status");

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }
    if (!data?.length) {
        return {ok: false, kind: "not_found"};
    }

    return {ok: true, status: data[0].status as EmailStatus};
}
