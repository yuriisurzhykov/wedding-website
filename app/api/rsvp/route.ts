import {NextResponse} from "next/server";

import {submitRsvp, type SubmitRsvpGuestSession} from "@features/rsvp-submit";
import {getGuestSessionCookieDescriptor, getGuestSessionRuntimeConfig} from "@features/guest-session/server";

function jsonWithOptionalGuestSessionCookie(
    body: Record<string, unknown>,
    guestSession: SubmitRsvpGuestSession | null,
    status = 200,
): NextResponse {
    const res = NextResponse.json(body, {status});
    if (guestSession) {
        const desc = getGuestSessionCookieDescriptor(
            guestSession.rawToken,
            getGuestSessionRuntimeConfig(),
        );
        res.cookies.set(desc.name, desc.value, desc.options);
    }
    return res;
}

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            {error: "invalid_json", message: "Request body must be valid JSON"},
            {status: 400},
        );
    }

    const result = await submitRsvp(body, {request});

    if (result.ok) {
        const gs = result.guestSession;
        return jsonWithOptionalGuestSessionCookie(
            {
                ok: true,
                sessionEstablished: gs !== null,
                ...(gs ? {session: gs.snapshot} : {}),
            },
            gs,
        );
    }

    if (result.kind === "feature_disabled") {
        return NextResponse.json({error: "feature_disabled"}, {status: 403});
    }

    if (result.kind === "notification") {
        console.error(
            "[api/rsvp] notification_failed",
            result.step,
            result.id,
            result.message,
        );
        const gs = result.guestSession;
        return jsonWithOptionalGuestSessionCookie(
            {
                error: "notification_failed",
                step: result.step,
                id: result.id,
                sessionEstablished: gs !== null,
                ...(gs ? {session: gs.snapshot} : {}),
            },
            gs,
            502,
        );
    }

    if (result.kind === "validation") {
        return NextResponse.json(
            {
                error: "validation",
                fieldErrors: result.fieldErrors,
                formErrors: result.formErrors,
            },
            {status: 400},
        );
    }

    console.error("[api/rsvp]", result.kind, result.message);
    return NextResponse.json({error: "server_error"}, {status: 500});
}
