import {NextResponse} from "next/server";

import {
    buildGuestSessionErrorJson,
    httpStatusForGuestSessionErrorCode,
} from "@features/guest-session";
import {confirmGalleryUpload} from "@features/gallery-upload";

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

    const result = await confirmGalleryUpload(body, request);

    if (result.ok) {
        return NextResponse.json(
            {ok: true, url: result.publicUrl},
            {status: 200},
        );
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
        console.error("[api/upload/confirm] config", result.message);
        return NextResponse.json(buildGuestSessionErrorJson("server_error"), {status: 500});
    }

    console.error("[api/upload/confirm] database", result.message);
    return NextResponse.json(buildGuestSessionErrorJson("upload_confirm_failed"), {
        status: 500,
    });
}
