import {NextResponse} from "next/server";

import {listGalleryPhotos} from "@features/gallery-list";

export const dynamic = "force-dynamic";

/**
 * Public JSON list for the gallery grid (no secrets). Used by the client to refresh after upload.
 */
export async function GET() {
    const result = await listGalleryPhotos(48);

    if (!result.ok) {
        console.error("[api/gallery/photos]", result.kind, result.message);
        return NextResponse.json({error: "server_error"}, {status: 500});
    }

    return NextResponse.json({photos: result.photos});
}
