import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {
    deleteEmailSenderForAdmin,
    updateEmailSenderForAdmin,
} from "@features/admin-email-senders";
import {NextResponse} from "next/server";
import {z} from "zod";

const idParamSchema = z.string().uuid();

type RouteContext = Readonly<{params: Promise<{id: string}>}>;

/**
 * PATCH /api/admin/email/senders/[id]
 * DELETE /api/admin/email/senders/[id]
 */
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
        return NextResponse.json({error: "Invalid sender id"}, {status: 400});
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({error: "Invalid JSON body"}, {status: 400});
    }

    const result = await updateEmailSenderForAdmin(idParsed.data, body);
    if (!result.ok) {
        if (result.kind === "validation") {
            return NextResponse.json({error: result.error}, {status: 400});
        }
        if (result.kind === "not_found") {
            return NextResponse.json({error: "Not found"}, {status: 404});
        }
        return NextResponse.json(
            {error: result.message},
            {status: result.kind === "config" ? 500 : 500},
        );
    }

    return NextResponse.json({sender: result.row});
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
        return NextResponse.json({error: "Invalid sender id"}, {status: 400});
    }

    const result = await deleteEmailSenderForAdmin(idParsed.data);
    if (!result.ok) {
        if (result.kind === "not_found") {
            return NextResponse.json({error: "Not found"}, {status: 404});
        }
        return NextResponse.json({error: result.message}, {status: 500});
    }

    return NextResponse.json({ok: true});
}
