import {NextResponse} from "next/server";

import {uploadGalleryPhotoFromMultipart} from "@features/gallery-upload";

export const runtime = "nodejs";

/** Large multipart uploads (Vercel / platforms may cap body size below 5 MB). */
export const maxDuration = 60;

export async function POST(request: Request) {
    const result = await uploadGalleryPhotoFromMultipart(request);

    if (result.ok) {
        return NextResponse.json(
            {ok: true, key: result.key, url: result.publicUrl},
            {status: 200},
        );
    }

    if (result.kind === "validation") {
        return NextResponse.json(
            {error: "validation", message: result.message},
            {status: 400},
        );
    }

    if (result.kind === "config") {
        console.error("[api/upload/server] config", result.message);
        return NextResponse.json({error: "server_error"}, {status: 500});
    }

    if (result.kind === "r2") {
        console.error("[api/upload/server] r2", result.message);
        return NextResponse.json({error: "server_error"}, {status: 500});
    }

    console.error("[api/upload/server] database", result.message);
    return NextResponse.json({error: "server_error"}, {status: 500});
}
