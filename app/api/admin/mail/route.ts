import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {listInboundEmailsForAdmin} from "@features/admin-inbox";
import {NextResponse} from "next/server";

/**
 * GET /api/admin/mail?limit=&cursor=
 *
 * Lists inbound messages (newest first). Optional `limit` (1–50) and opaque `cursor` for pagination.
 */
export async function GET(request: Request) {
    const rl = await checkAdminRateLimit(request, "api");
    const blocked = rateLimitToResponse(rl);
    if (blocked) {
        return blocked;
    }
    if (!(await isAdminApiAuthorized(request))) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const cursor = url.searchParams.get("cursor");

    let limit: number | undefined;
    if (limitParam !== null && limitParam !== "") {
        const n = Number(limitParam);
        if (!Number.isFinite(n) || n < 1) {
            return NextResponse.json({error: "Invalid limit"}, {status: 400});
        }
        limit = Math.floor(n);
    }

    const result = await listInboundEmailsForAdmin({
        limit,
        cursor: cursor === "" ? null : cursor,
    });

    if (!result.ok) {
        if (result.kind === "invalid_cursor") {
            return NextResponse.json({error: result.message}, {status: 400});
        }
        return NextResponse.json({error: result.message}, {status: 500});
    }

    return NextResponse.json({
        emails: result.emails,
        nextCursor: result.nextCursor,
    });
}
