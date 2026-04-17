import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {
    createReplyTemplateForAdmin,
    listReplyTemplatesForAdmin,
} from "@features/admin-reply-templates";
import {NextResponse} from "next/server";

/**
 * GET /api/admin/mail/templates
 * POST /api/admin/mail/templates
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

    const result = await listReplyTemplatesForAdmin();
    if (!result.ok) {
        return NextResponse.json(
            {error: result.message},
            {status: result.kind === "config" ? 500 : 500},
        );
    }

    return NextResponse.json({templates: result.rows});
}

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

    const result = await createReplyTemplateForAdmin(body);
    if (!result.ok) {
        if (result.kind === "validation") {
            return NextResponse.json({error: result.error}, {status: 400});
        }
        return NextResponse.json(
            {error: result.message},
            {status: result.kind === "config" ? 500 : 500},
        );
    }

    return NextResponse.json({template: result.row});
}
