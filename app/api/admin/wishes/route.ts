import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {deleteWishesForAdmin} from "@features/admin-wishes-delete";
import {NextResponse} from "next/server";

/**
 * DELETE /api/admin/wishes
 *
 * Body: `{ "ids": string[] }` (UUIDs, max 100).
 * Auth: admin session cookie or legacy `ADMIN_SECRET` headers.
 * Rate limit: before auth (429 + `retry_after`).
 */
export async function DELETE(request: Request) {
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

    const result = await deleteWishesForAdmin(body);
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
        return NextResponse.json(
            {error: result.message},
            {status: result.kind === "config" ? 500 : 500},
        );
    }

    return NextResponse.json({ok: true, deleted: result.deleted});
}
