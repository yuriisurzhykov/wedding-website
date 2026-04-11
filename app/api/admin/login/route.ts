import {
    adminLoginBodySchema,
    checkAdminRateLimit,
    performAdminLogin,
    rateLimitToResponse,
} from "@features/admin-api";
import {NextResponse} from "next/server";

/**
 * POST /api/admin/login
 *
 * Body: `{ "password": string }`. Sets httpOnly session cookie on success.
 * Rate limit: `login` (stricter). Returns **429** with `retry_after` when limited.
 */
export async function POST(request: Request) {
    const rl = await checkAdminRateLimit(request, "login");
    if (process.env.NODE_ENV === "development" && !rl.ok) {
        console.warn("[POST /api/admin/login] rate limit check:", rl);
    }
    const blocked = rateLimitToResponse(rl);
    if (blocked) {
        return blocked;
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({error: "Invalid JSON body"}, {status: 400});
    }

    const parsed = adminLoginBodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({error: "Invalid body"}, {status: 400});
    }

    return performAdminLogin(parsed.data);
}
