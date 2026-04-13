import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {presignScheduleIconSvgUpload} from "@features/wedding-schedule";
import {NextResponse} from "next/server";

/**
 * POST /api/admin/schedule-icon/presign
 *
 * Body: `{ "size": number }` — byte length of the SVG file (max see entity constant).
 * Response: `{ url, key, publicUrl }` for browser `PUT` then storing `publicUrl` in `schedule_items.icon_url`.
 */
export async function POST(request: Request) {
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

    const result = await presignScheduleIconSvgUpload(body);
    if (result.ok) {
        return NextResponse.json(
            {url: result.url, key: result.key, publicUrl: result.publicUrl},
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
        console.error("[api/admin/schedule-icon/presign] config", result.message);
        return NextResponse.json({error: "server_misconfigured"}, {status: 500});
    }

    console.error("[api/admin/schedule-icon/presign] r2", result.message);
    return NextResponse.json({error: "presign_failed"}, {status: 500});
}
