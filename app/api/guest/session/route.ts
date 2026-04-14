import {NextResponse} from "next/server";

import {mapRsvpFormToRow} from "@entities/rsvp";

import {
    buildGuestSessionErrorJson,
    httpStatusForGuestSessionErrorCode,
    mapValidateGuestSessionFailureToCode,
} from "@features/guest-session";
import {
    buildGuestSessionRestoreRateBucketKey,
    checkGuestSessionRestoreRate,
    getClientIpFromRequest,
    getGuestSessionCookieDescriptor,
    getGuestSessionRuntimeConfig,
    loadGuestSessionClientSnapshotForGuestAccount,
    parseGuestSessionRestoreBody,
    restoreGuestSessionByCredentials,
    validateGuestSessionFromRequest,
} from "@features/guest-session/server";
import {createServerClient} from "@shared/api/supabase/server";

function jsonWithGuestSessionCookie(
    body: Record<string, unknown>,
    rawToken: string,
): NextResponse {
    const res = NextResponse.json(body);
    const desc = getGuestSessionCookieDescriptor(
        rawToken,
        getGuestSessionRuntimeConfig(),
    );
    res.cookies.set(desc.name, desc.value, desc.options);
    return res;
}

/**
 * Returns §4 session snapshot when the HttpOnly cookie is valid; otherwise `sessionEstablished: false`
 * (including when no cookie is sent). Invalid or expired token with a cookie present yields 401 + `error.code`.
 */
export async function GET(request: Request) {
    const supabase = createServerClient();
    const validation = await validateGuestSessionFromRequest(supabase, request);

    if (!validation.ok) {
        if (validation.reason === "missing") {
            return NextResponse.json({sessionEstablished: false}, {status: 200});
        }
        if (validation.reason === "database") {
            console.error("[api/guest/session] GET validate", validation.message);
            const code = mapValidateGuestSessionFailureToCode(validation);
            return NextResponse.json(buildGuestSessionErrorJson(code), {
                status: httpStatusForGuestSessionErrorCode(code),
            });
        }
        const code = mapValidateGuestSessionFailureToCode(validation);
        return NextResponse.json(buildGuestSessionErrorJson(code), {
            status: httpStatusForGuestSessionErrorCode(code),
        });
    }

    const loaded = await loadGuestSessionClientSnapshotForGuestAccount(
        supabase,
        validation.session.guest_account_id,
    );

    if (!loaded.ok) {
        if (loaded.kind === "database") {
            console.error("[api/guest/session] GET guest account", loaded.message);
            return NextResponse.json(buildGuestSessionErrorJson("server_error"), {
                status: httpStatusForGuestSessionErrorCode("server_error"),
            });
        }
        return NextResponse.json(buildGuestSessionErrorJson("guest_account_missing"), {
            status: httpStatusForGuestSessionErrorCode("guest_account_missing"),
        });
    }

    return NextResponse.json({
        sessionEstablished: true,
        session: loaded.snapshot,
    });
}

/**
 * Restores a guest session from RSVP name + email (normalized like RSVP). Sets HttpOnly cookie and
 * returns §4 JSON snapshot on success.
 */
export async function POST(request: Request) {
    let raw: unknown;
    try {
        raw = await request.json();
    } catch {
        return NextResponse.json(buildGuestSessionErrorJson("request_failed"), {
            status: httpStatusForGuestSessionErrorCode("request_failed"),
        });
    }

    const parsed = parseGuestSessionRestoreBody(raw);
    if (!parsed.ok) {
        const flat = parsed.error.flatten();
        return NextResponse.json(
            {
                error: "validation",
                fieldErrors: flat.fieldErrors,
                formErrors: flat.formErrors,
            },
            {status: 400},
        );
    }

    const supabase = createServerClient();

    const rowForRate = mapRsvpFormToRow({
        name: parsed.name,
        email: parsed.email,
        attending: true,
        guestCount: 1,
    });
    const rate = await checkGuestSessionRestoreRate(
        supabase,
        buildGuestSessionRestoreRateBucketKey({
            clientIp: getClientIpFromRequest(request),
            normalizedName: rowForRate.name,
            normalizedEmail: rowForRate.email ?? "",
        }),
    );

    if (!rate.ok) {
        if (rate.reason === "database") {
            console.error("[api/guest/session] POST rate limit", rate.message);
            return NextResponse.json(buildGuestSessionErrorJson("server_error"), {
                status: httpStatusForGuestSessionErrorCode("server_error"),
            });
        }
        return NextResponse.json(
            buildGuestSessionErrorJson("rate_limited", {
                retryAfterSec: rate.retryAfterSec,
            }),
            {status: httpStatusForGuestSessionErrorCode("rate_limited")},
        );
    }

    const result = await restoreGuestSessionByCredentials(
        supabase,
        parsed.name,
        parsed.email,
    );

    if (!result.ok) {
        if (result.kind === "no_match") {
            return NextResponse.json(
                buildGuestSessionErrorJson("restore_credentials_no_match"),
                {
                    status: httpStatusForGuestSessionErrorCode(
                        "restore_credentials_no_match",
                    ),
                },
            );
        }
        console.error("[api/guest/session] POST restore", result.message);
        return NextResponse.json(buildGuestSessionErrorJson("server_error"), {
            status: httpStatusForGuestSessionErrorCode("server_error"),
        });
    }

    return jsonWithGuestSessionCookie(
        {
            sessionEstablished: true,
            session: result.session,
        },
        result.rawToken,
    );
}
