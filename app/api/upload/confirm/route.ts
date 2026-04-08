import {NextResponse} from "next/server";

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

    const result = await confirmGalleryUpload(body);

    if (result.ok) {
        return NextResponse.json(
            {ok: true, url: result.publicUrl},
            {status: 200},
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

    if (result.kind === "config") {
        console.error("[api/upload/confirm] config", result.message);
        return NextResponse.json({error: "server_error"}, {status: 500});
    }

    console.error("[api/upload/confirm] database", result.message);
    return NextResponse.json({error: "server_error"}, {status: 500});
}
