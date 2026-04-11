import {
    checkAdminRateLimit,
    performAdminLogout,
    rateLimitToResponse,
} from "@features/admin-api";
import {NextResponse} from "next/server";

/**
 * POST /api/admin/logout
 *
 * Clears the admin session cookie. Rate limit: `api`.
 */
export async function POST(request: Request) {
    const rl = await checkAdminRateLimit(request, "api");
    const blocked = rateLimitToResponse(rl);
    if (blocked) {
        return blocked;
    }

    return performAdminLogout();
}
