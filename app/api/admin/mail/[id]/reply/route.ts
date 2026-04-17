import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {sendInboxReply} from "@features/admin-inbox-reply";
import {NextResponse} from "next/server";
import {z} from "zod";

const idParamSchema = z.string().uuid();

type RouteContext = Readonly<{params: Promise<{id: string}>}>;

/**
 * POST /api/admin/mail/[id]/reply
 *
 * Body: same as {@link sendInboxReply} input except `inbound_email_id` is taken from the path (path wins if both are sent).
 */
export async function POST(request: Request, context: RouteContext) {
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

    const merged =
        typeof body === "object" && body !== null && !Array.isArray(body)
            ? {...(body as Record<string, unknown>), inbound_email_id: idParsed.data}
            : {inbound_email_id: idParsed.data};

    const result = await sendInboxReply(merged);
    if (!result.ok) {
        if (result.kind === "validation") {
            return NextResponse.json(
                {error: result.message ?? "Validation failed"},
                {status: 400},
            );
        }
        if (result.kind === "not_found") {
            return NextResponse.json(
                {error: result.message ?? "Not found"},
                {status: 404},
            );
        }
        if (result.kind === "resend") {
            return NextResponse.json(
                {error: result.message ?? "Resend error"},
                {status: 502},
            );
        }
        return NextResponse.json(
            {error: result.message ?? "Request failed"},
            {status: 500},
        );
    }

    return NextResponse.json({
        ok: true,
        reply_id: result.reply_id,
        resend_email_id: result.resend_email_id,
    });
}
