import {NextResponse} from "next/server";

import {
    buildGuestSessionErrorJson,
    httpStatusForGuestSessionErrorCode,
} from "@features/guest-session";
import {
    executeGuestCompanionEmailRebind,
    parseGuestCompanionRehomeBody,
} from "@features/guest-session/server";
import {createServerClient} from "@shared/api/supabase/server";

/**
 * Companion rehome: name (as on the RSVP party list) + new personal email. Invalidates sessions for that
 * `guest_accounts` row, stores the new email, mints a magic link, and sends the transactional email (fire-and-forget).
 * Response is always `{ accepted: true }` on success paths that must not disclose whether a row matched.
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

    const parsed = parseGuestCompanionRehomeBody(raw);
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
    const result = await executeGuestCompanionEmailRebind(
        supabase,
        {
            name: parsed.name,
            email: parsed.email,
            locale: parsed.locale,
        },
        request,
    );

    if (!result.ok) {
        if (result.kind === "rate_limited") {
            return NextResponse.json(
                buildGuestSessionErrorJson("rate_limited", {
                    retryAfterSec: result.retryAfterSec,
                }),
                {status: httpStatusForGuestSessionErrorCode("rate_limited")},
            );
        }
        console.error("[api/guest/account/email]", result.message);
        return NextResponse.json(buildGuestSessionErrorJson("server_error"), {
            status: httpStatusForGuestSessionErrorCode("server_error"),
        });
    }

    return NextResponse.json({accepted: true}, {status: 200});
}
