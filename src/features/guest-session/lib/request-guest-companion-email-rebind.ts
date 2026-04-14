import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

import {
    normalizeGuestAccountEmailForStorage,
    normalizeGuestDisplayNameForStorage,
} from "@entities/guest-account";
import {mapRsvpFormToRow} from "@entities/rsvp";
import {resolvePublicSiteBaseForServerEmail} from "@shared/lib/get-public-site-url";

import {buildGuestMagicLinkClaimAbsoluteUrl} from "./build-guest-magic-link-claim-absolute-url";
import {getClientIpFromRequest} from "./client-ip";
import {createGuestMagicLinkToken} from "./create-magic-link-token";
import {
    buildGuestSessionRestoreRateBucketKey,
    checkGuestSessionRestoreRate,
} from "./restore-session-rate-limit";
import {notifyGuestCompanionRehomeMagicLink} from "./notify-guest-companion-rehome-magic-link";
import type {GuestRehomeEmailLocale} from "./rehome-magic-link-email-copy";

export type ExecuteGuestCompanionEmailRebindResult =
    | { ok: true }
    | { ok: false; kind: "rate_limited"; retryAfterSec: number }
    | { ok: false; kind: "server_error"; message: string };

async function emailConflictsWithProductIdentity(
    supabase: SupabaseClient,
    normalizedNewEmail: string,
    guestAccountId: string,
): Promise<{ ok: true; conflict: boolean } | { ok: false; message: string }> {
    const {data: otherGa, error: e1} = await supabase
        .from("guest_accounts")
        .select("id")
        .neq("id", guestAccountId)
        .eq("email", normalizedNewEmail)
        .maybeSingle();

    if (e1) {
        return {ok: false, message: e1.message};
    }
    if (otherGa) {
        return {ok: true, conflict: true};
    }

    const {data: rsvps, error: e2} = await supabase
        .from("rsvp")
        .select("email")
        .not("email", "is", null)
        .limit(4000);

    if (e2) {
        return {ok: false, message: e2.message};
    }

    for (const row of rsvps ?? []) {
        const em = row.email;
        if (typeof em === "string" && em.trim().toLowerCase() === normalizedNewEmail) {
            return {ok: true, conflict: true};
        }
    }

    return {ok: true, conflict: false};
}

/**
 * Companion-only flow: match a single non-primary `guest_accounts` row by stored display name,
 * invalidate its sessions, set `email` to the new mailbox, mint a magic-link token, and enqueue
 * the transactional email. Ambiguous name, conflicts, or missing row → success no-op (safe response).
 *
 * @param request — Current HTTP request (client IP for rate limit, optional site base for claim URL).
 */
export async function executeGuestCompanionEmailRebind(
    supabase: SupabaseClient,
    input: { name: string; email: string; locale: GuestRehomeEmailLocale },
    request: Request,
): Promise<ExecuteGuestCompanionEmailRebindResult> {
    const rowForRate = mapRsvpFormToRow({
        name: input.name,
        email: input.email,
        attending: true,
        guestCount: 1,
    });
    const normalizedEmailForRate =
        normalizeGuestAccountEmailForStorage(input.email) ?? rowForRate.email ?? "";

    const rate = await checkGuestSessionRestoreRate(
        supabase,
        buildGuestSessionRestoreRateBucketKey({
            clientIp: getClientIpFromRequest(request),
            normalizedName: rowForRate.name,
            normalizedEmail: normalizedEmailForRate,
        }),
    );

    if (!rate.ok) {
        if (rate.reason === "database") {
            console.error("[guest-session] rehome rate limit", rate.message);
            return {ok: false, kind: "server_error", message: rate.message};
        }
        return {
            ok: false,
            kind: "rate_limited",
            retryAfterSec: rate.retryAfterSec,
        };
    }

    const displayName = normalizeGuestDisplayNameForStorage(input.name);
    const {data: matches, error: findErr} = await supabase
        .from("guest_accounts")
        .select("id, display_name, email")
        .eq("is_primary", false)
        .eq("display_name", displayName);

    if (findErr) {
        console.error("[guest-session] rehome lookup", findErr.message);
        return {ok: false, kind: "server_error", message: findErr.message};
    }
    if (!matches || matches.length !== 1) {
        return {ok: true};
    }

    const account = matches[0];
    const normalizedNew = normalizeGuestAccountEmailForStorage(input.email);
    if (!normalizedNew) {
        return {ok: true};
    }

    const conflictCheck = await emailConflictsWithProductIdentity(
        supabase,
        normalizedNew,
        account.id,
    );
    if (!conflictCheck.ok) {
        console.error("[guest-session] rehome conflict check", conflictCheck.message);
        return {ok: false, kind: "server_error", message: conflictCheck.message};
    }
    if (conflictCheck.conflict) {
        return {ok: true};
    }

    const {error: delErr} = await supabase
        .from("guest_sessions")
        .delete()
        .eq("guest_account_id", account.id);

    if (delErr) {
        console.error("[guest-session] rehome delete sessions", delErr.message);
        return {ok: false, kind: "server_error", message: delErr.message};
    }

    const {error: updErr} = await supabase
        .from("guest_accounts")
        .update({email: normalizedNew})
        .eq("id", account.id);

    if (updErr) {
        if (updErr.code === "23505") {
            return {ok: true};
        }
        console.error("[guest-session] rehome update email", updErr.message);
        return {ok: false, kind: "server_error", message: updErr.message};
    }

    const created = await createGuestMagicLinkToken(supabase, account.id);
    if (!created.ok) {
        console.error("[guest-session] rehome magic link token", created.message);
        return {ok: false, kind: "server_error", message: created.message};
    }

    const siteBase = resolvePublicSiteBaseForServerEmail(request)?.trim();
    if (!siteBase) {
        console.warn(
            "[guest-session] rehome: no public site base; token stored but confirmation email omitted",
        );
        return {ok: true};
    }

    const claimUrl = buildGuestMagicLinkClaimAbsoluteUrl(
        siteBase.replace(/\/+$/, ""),
        created.rawToken,
        input.locale,
    );

    void notifyGuestCompanionRehomeMagicLink({
        to: normalizedNew,
        displayName: account.display_name,
        locale: input.locale,
        magicLinkClaimUrl: claimUrl,
    }).catch((err) => {
        console.error(
            "[guest-session] rehome magic-link email failed",
            err instanceof Error ? err.message : String(err),
        );
    });

    return {ok: true};
}
