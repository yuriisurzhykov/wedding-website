import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {
    deleteInboundEmailForAdmin,
    getInboundEmailForAdmin,
    updateInboundEmailStatusForAdmin,
} from "@features/admin-inbox";
import {NextResponse} from "next/server";
import {z} from "zod";

const idParamSchema = z.string().uuid();

type RouteContext = Readonly<{params: Promise<{id: string}>}>;

/**
 * GET /api/admin/mail/[id]
 * PATCH /api/admin/mail/[id] — body: `{ status: 'unread' | 'read' | 'archived' }`
 * DELETE /api/admin/mail/[id]
 */
export async function GET(request: Request, context: RouteContext) {
    const rl = await checkAdminRateLimit(request, "api");
    const blocked = rateLimitToResponse(rl);
    if (blocked) {
        return blocked;
    }
    if (!(await isAdminApiAuthorized(request))) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const {id} = await context.params;
    const idParsed = idParamSchema.safeParse(id);
    if (!idParsed.success) {
        return NextResponse.json({error: "Invalid message id"}, {status: 400});
    }

    const result = await getInboundEmailForAdmin(idParsed.data);
    if (!result.ok) {
        if (result.kind === "not_found") {
            return NextResponse.json({error: "Not found"}, {status: 404});
        }
        return NextResponse.json({error: result.message}, {status: 500});
    }

    return NextResponse.json({
        email: result.email,
        attachments: result.attachments,
        replies: result.replies,
    });
}

export async function PATCH(request: Request, context: RouteContext) {
    const rl = await checkAdminRateLimit(request, "api");
    const blocked = rateLimitToResponse(rl);
    if (blocked) {
        return blocked;
    }
    if (!(await isAdminApiAuthorized(request))) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const {id} = await context.params;
    const idParsed = idParamSchema.safeParse(id);
    if (!idParsed.success) {
        return NextResponse.json({error: "Invalid message id"}, {status: 400});
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({error: "Invalid JSON body"}, {status: 400});
    }

    const result = await updateInboundEmailStatusForAdmin(idParsed.data, body);
    if (!result.ok) {
        if (result.kind === "validation") {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    fieldErrors: result.fieldErrors,
                    formErrors: result.formErrors,
                },
                {status: 400},
            );
        }
        if (result.kind === "not_found") {
            return NextResponse.json({error: "Not found"}, {status: 404});
        }
        return NextResponse.json({error: result.message}, {status: 500});
    }

    return NextResponse.json({ok: true, status: result.status});
}

export async function DELETE(request: Request, context: RouteContext) {
    const rl = await checkAdminRateLimit(request, "api");
    const blocked = rateLimitToResponse(rl);
    if (blocked) {
        return blocked;
    }
    if (!(await isAdminApiAuthorized(request))) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const {id} = await context.params;
    const idParsed = idParamSchema.safeParse(id);
    if (!idParsed.success) {
        return NextResponse.json({error: "Invalid message id"}, {status: 400});
    }

    const result = await deleteInboundEmailForAdmin(idParsed.data);
    if (!result.ok) {
        if (result.kind === "not_found") {
            return NextResponse.json({error: "Not found"}, {status: 404});
        }
        return NextResponse.json({error: result.message}, {status: 500});
    }

    return NextResponse.json({ok: true});
}
