import {NextResponse} from "next/server";
import {z} from "zod";

import {listGalleryPhotos} from "@features/gallery-list";

export const dynamic = "force-dynamic";

const querySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(48),
    offset: z.coerce.number().int().min(0).max(50_000).default(0),
});

/**
 * Public JSON list for the gallery grid (no secrets). Used for “load more” and refresh after upload.
 * Query: `limit` (1–100, default 48), `offset` (default 0). Response: `{ photos, hasMore }`.
 */
export async function GET(request: Request) {
    const sp = new URL(request.url).searchParams;
    const parsed = querySchema.safeParse({
        limit: sp.get("limit") || undefined,
        offset: sp.get("offset") || undefined,
    });

    if (!parsed.success) {
        return NextResponse.json({error: "invalid_query"}, {status: 400});
    }

    const {limit, offset} = parsed.data;
    const result = await listGalleryPhotos({limit, offset});

    if (!result.ok) {
        console.error("[api/gallery/photos]", result.kind, result.message);
        return NextResponse.json({error: "server_error"}, {status: 500});
    }

    return NextResponse.json({
        photos: result.photos,
        hasMore: result.hasMore,
    });
}
