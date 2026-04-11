import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {sendAdminEmail} from "@features/admin-email-dispatch";
import {NextResponse} from "next/server";

/**
 * POST /api/admin/email/send
 *
 * Body: {@link adminEmailSendSchema} from `@features/admin-email-dispatch`.
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

    const result = await sendAdminEmail(body);
    if (!result.ok) {
        if (result.kind === "validation") {
            return NextResponse.json({error: result.error}, {status: 400});
        }
        if (result.kind === "not_found") {
            return NextResponse.json({error: "Template not found"}, {status: 404});
        }
        if (result.kind === "sender_not_found") {
            return NextResponse.json({error: "Sender not found"}, {status: 404});
        }
        if (result.kind === "resend_unconfigured") {
            return NextResponse.json(
                {error: result.message},
                {status: 503},
            );
        }
        return NextResponse.json(
            {error: result.message},
            {status: result.kind === "config" ? 500 : 500},
        );
    }

    return NextResponse.json({
        ok: true,
        mode: result.mode,
        sent: result.sent,
        failed: result.failed,
        ...(result.capped_total !== undefined
            ? {capped_total: result.capped_total}
            : {}),
    });
}
