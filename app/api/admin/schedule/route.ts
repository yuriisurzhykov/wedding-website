import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {getWeddingSchedule, replaceWeddingSchedule} from "@features/wedding-schedule";
import {NextResponse} from "next/server";

/**
 * GET /api/admin/schedule
 *
 * Returns current `schedule_section` and `schedule_items` (same snapshot as server loaders). Auth and rate limit match
 * other admin routes.
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

    const snapshot = await getWeddingSchedule();
    return NextResponse.json({
        ok: true,
        section: snapshot.section,
        items: snapshot.items,
    });
}

/**
 * PATCH /api/admin/schedule
 *
 * Body: JSON matching {@link weddingScheduleReplacePayloadSchema} (replace-all `items`, optional `section` copy).
 * Auth: admin session or legacy token (same as other admin routes).
 */
export async function PATCH(request: Request) {
    const rl = await checkAdminRateLimit(request, "api");
    const blocked = rateLimitToResponse(rl);
    if (blocked) {
        return blocked;
    }
    if (!(await isAdminApiAuthorized(request))) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({error: "Invalid JSON body"}, {status: 400});
    }

    const result = await replaceWeddingSchedule(body);
    if (!result.ok) {
        return NextResponse.json({error: result.error}, {status: 400});
    }

    return NextResponse.json({
        ok: true,
        updated_at: result.section?.updated_at ?? null,
        section: result.section,
        items: result.items,
    });
}
