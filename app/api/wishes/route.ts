import {NextResponse} from "next/server";
import {z} from "zod";

import {
    buildGuestSessionErrorJson,
    httpStatusForGuestSessionErrorCode,
} from "@features/guest-session";
import {listWishes} from "@features/wish-list";
import {submitWish} from "@features/wish-submit";

export const dynamic = "force-dynamic";

const listQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(50_000).default(0),
});

/**
 * Public paginated wish list (same contract as `GET /api/gallery/photos`). See `@features/wish-list` README.
 */
export async function GET(request: Request) {
    const sp = new URL(request.url).searchParams;
    const parsed = listQuerySchema.safeParse({
        limit: sp.get("limit") || undefined,
        offset: sp.get("offset") || undefined,
    });

    if (!parsed.success) {
        return NextResponse.json({error: "invalid_query"}, {status: 400});
    }

    const {limit, offset} = parsed.data;
    const result = await listWishes({limit, offset});

    if (!result.ok) {
        console.error("[api/wishes] GET", result.kind, result.message);
        return NextResponse.json({error: "server_error"}, {status: 500});
    }

    return NextResponse.json({
        wishes: result.wishes,
        hasMore: result.hasMore,
    });
}

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

    const result = await submitWish(body, request);

    if (result.ok) {
        return NextResponse.json({ok: true}, {status: 200});
    }

    if (result.kind === "feature_disabled") {
        return NextResponse.json({error: "feature_disabled"}, {status: 403});
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

    if (result.kind === "celebration") {
        return NextResponse.json(buildGuestSessionErrorJson("celebration_not_live"), {
            status: httpStatusForGuestSessionErrorCode("celebration_not_live"),
        });
    }

    if (result.kind === "config") {
        console.error("[api/wishes] config", result.message);
        return NextResponse.json({error: "server_error"}, {status: 500});
    }

    console.error("[api/wishes] database", result.message);
    return NextResponse.json({error: "server_error"}, {status: 500});
}
