import {NextResponse} from "next/server";

import {
    buildGuestSessionErrorJson,
    httpStatusForGuestSessionErrorCode,
} from "@features/guest-session";
import {uploadGalleryPhotoFromMultipart} from "@features/gallery-upload";
import {IpRateLimiter, rateLimit} from "@shared/lib";

export const runtime = "nodejs";

/** Large multipart uploads (Vercel / platforms may cap body size below 5 MB). */
export const maxDuration = 60;

const limiter = new IpRateLimiter({maxRequests: 10, windowMs: 15 * 60_000});

export async function POST(request: Request) {
    const rl = rateLimit(limiter, request);
    if (!rl.allowed) {
        return NextResponse.json(
            {error: "too_many_requests"},
            {status: 429, headers: {"Retry-After": String(Math.ceil(rl.retryAfterMs / 1000))}},
        );
    }

    const result = await uploadGalleryPhotoFromMultipart(request);

    if (result.ok) {
        return NextResponse.json(
            {ok: true, key: result.key, url: result.publicUrl},
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
            {error: "validation", message: result.message},
            {status: 400},
        );
    }

    if (result.kind === "config") {
        console.error("[api/upload/server] config", result.message);
        return NextResponse.json(buildGuestSessionErrorJson("server_error"), {status: 500});
    }

    if (result.kind === "r2") {
        console.error("[api/upload/server] r2", result.message);
        return NextResponse.json(buildGuestSessionErrorJson("upload_r2_failed"), {
            status: 500,
        });
    }

    console.error("[api/upload/server] database", result.message);
    return NextResponse.json(buildGuestSessionErrorJson("upload_confirm_failed"), {
        status: 500,
    });
}
