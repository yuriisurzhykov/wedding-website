import {NextResponse} from "next/server";

import {
    buildGuestSessionErrorJson,
    httpStatusForGuestSessionErrorCode,
} from "@features/guest-session";
import {presignGalleryUpload} from "@features/gallery-upload";

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

    const result = await presignGalleryUpload(body, request);

    if (result.ok) {
        return NextResponse.json({url: result.url, key: result.key}, {status: 200});
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

    if (result.kind === "celebration_closed") {
        return NextResponse.json(buildGuestSessionErrorJson("celebration_not_live"), {
            status: httpStatusForGuestSessionErrorCode("celebration_not_live"),
        });
    }

    if (result.kind === "config") {
        console.error("[api/upload/presign] config", result.message);
        return NextResponse.json(buildGuestSessionErrorJson("server_error"), {status: 500});
    }

    console.error("[api/upload/presign] r2", result.message);
    return NextResponse.json(buildGuestSessionErrorJson("upload_presign_failed"), {
        status: 500,
    });
}
