import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {listEmailSendLogForAdmin} from "@features/admin-email-dispatch";
import {NextResponse} from "next/server";
import {z} from "zod";

const querySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

/**
 * GET /api/admin/email/log?limit=
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
    const parsed = querySchema.safeParse({
        limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
        return NextResponse.json({error: "Invalid query"}, {status: 400});
    }

    const result = await listEmailSendLogForAdmin({
        limit: parsed.data.limit,
    });
    if (!result.ok) {
        return NextResponse.json(
            {error: result.message},
            {status: result.kind === "config" ? 500 : 500},
        );
    }

    return NextResponse.json({log: result.rows});
}
