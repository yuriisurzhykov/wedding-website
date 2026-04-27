import {NextResponse} from "next/server";

import {
    buildGuestSessionErrorJson,
    httpStatusForGuestSessionErrorCode,
} from "@features/guest-session";
import {confirmGalleryUpload} from "@features/gallery-upload";
import {IpRateLimiter, rateLimit, readJsonBody} from "@shared/lib";

const limiter = new IpRateLimiter({maxRequests: 10, windowMs: 15 * 60_000});

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

    const result = await confirmGalleryUpload(parsed.data, request);

    if (result.ok) {
        return NextResponse.json(
            {ok: true, url: result.publicUrl},
            {status: 200},
        );
    }

    if (result.kind === "feature_disabled") {
        return NextResponse.json({error: "feature_disabled"}, {status: 403});
    }

    if (result.kind === "no_session") {
        return NextResponse.json(buildGuestSessionErrorJson(result.code), {
            status: httpStatusForGuestSessionErrorCode(result.code),
        });
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

    if (result.kind === "config") {
        console.error("[api/upload/confirm] config", result.message);
        return NextResponse.json(buildGuestSessionErrorJson("server_error"), {status: 500});
    }

    console.error("[api/upload/confirm] database", result.message);
    return NextResponse.json(buildGuestSessionErrorJson("upload_confirm_failed"), {
        status: 500,
    });
}
