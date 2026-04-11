import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {
    listRsvpsForAdmin,
    parseAdminRsvpsSearchParams,
} from "@features/admin-rsvp-list";
import {NextResponse} from "next/server";

/**
 * GET /api/admin/rsvps?attending=true|false
 *
 * Auth: admin session cookie or legacy `ADMIN_SECRET` headers.
 * Rate limit: before auth (429 + `retry_after`).
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

    const parsed = parseAdminRsvpsSearchParams(
        new URL(request.url).searchParams,
    );
    if (!parsed.ok) {
        return NextResponse.json({error: parsed.error}, {status: 400});
    }

    const result = await listRsvpsForAdmin({attending: parsed.attending});
    if (!result.ok) {
        return NextResponse.json(
            {error: result.message},
            {status: result.kind === "config" ? 500 : 500},
        );
    }

    return NextResponse.json({rsvps: result.rows});
}
