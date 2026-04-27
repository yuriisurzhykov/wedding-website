import {NextResponse} from "next/server";

import {submitRsvp, type SubmitRsvpGuestSession} from "@features/rsvp-submit";
import {getGuestSessionCookieDescriptor, getGuestSessionRuntimeConfig} from "@features/guest-session/server";
import {IpRateLimiter, rateLimit, readJsonBody} from "@shared/lib";

const limiter = new IpRateLimiter({maxRequests: 1, windowMs: 30 * 60_000});

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
    const rl = rateLimit(limiter, request);
    if (!rl.allowed) {
        return NextResponse.json(
            {error: "too_many_requests"},
            {status: 429, headers: {"Retry-After": String(Math.ceil(rl.retryAfterMs / 1000))}},
        );
    }

    const parsed = await readJsonBody(request);
    if (!parsed.ok) return parsed.errorResponse;
    const body = parsed.data;

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
