import {NextResponse} from "next/server";
import {z} from "zod";

import {
    buildGuestSessionErrorJson,
    httpStatusForGuestSessionErrorCode,
} from "@features/guest-session";
import {validateGuestSessionFromRequest} from "@features/guest-session/server";
import {deleteGalleryPhoto} from "@features/gallery-upload";
import {listGalleryPhotos} from "@features/gallery-list";
import {createServerClient} from "@shared/api/supabase/server";

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

    let viewerGuestAccountId: string | null = null;
    try {
        const supabase = createServerClient();
        const validation = await validateGuestSessionFromRequest(supabase, request);
        if (validation.ok) {
            viewerGuestAccountId = validation.session.guest_account_id;
        }
    } catch {
        /* misconfigured env — list still works without per-row canDelete */
    }

    const result = await listGalleryPhotos({limit, offset, viewerGuestAccountId});

    if (!result.ok) {
        console.error("[api/gallery/photos]", result.kind, result.message);
        return NextResponse.json({error: "server_error"}, {status: 500});
    }

    return NextResponse.json({
        photos: result.photos,
        hasMore: result.hasMore,
    });
}

/**
 * Body: `{ "photoId": "<uuid>" }`. Requires guest session cookie; deletes R2 object and DB row when `photos.guest_account_id` matches.
 */
export async function DELETE(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            {error: "invalid_json", message: "Request body must be valid JSON"},
            {status: 400},
        );
    }

    const result = await deleteGalleryPhoto(body, request);

    if (result.ok) {
        return NextResponse.json({ok: true}, {status: 200});
    }

    if (result.kind === "feature_disabled") {
        return NextResponse.json({error: "feature_disabled"}, {status: 403});
    }

    if (result.kind === "no_session") {
        return NextResponse.json(buildGuestSessionErrorJson(result.code), {
            status: httpStatusForGuestSessionErrorCode(result.code),
        });
    }

    if (result.kind === "forbidden") {
        return NextResponse.json(buildGuestSessionErrorJson("photo_delete_forbidden"), {
            status: httpStatusForGuestSessionErrorCode("photo_delete_forbidden"),
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
        console.error("[api/gallery/photos] DELETE config", result.message);
        return NextResponse.json(buildGuestSessionErrorJson("server_error"), {status: 500});
    }

    console.error("[api/gallery/photos] DELETE database", result.message);
    return NextResponse.json(buildGuestSessionErrorJson("server_error"), {status: 500});
}
