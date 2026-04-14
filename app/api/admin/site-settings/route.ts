import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {updateSiteSettings} from "@features/site-settings";
import {NextResponse} from "next/server";

/**
 * PATCH /api/admin/site-settings
 *
 * Body: JSON matching {@link siteSettingsPatchSchema} (partial `capabilities` and/or `public_contact`; schedule uses
 * `PATCH /api/admin/schedule`).
 * Auth: valid admin session cookie or legacy `Authorization: Bearer` / `x-admin-token` with `ADMIN_SECRET`.
 * Rate limit: applied before auth (429 + `retry_after`).
 */
export async function PATCH(request: Request) {
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

    const result = await updateSiteSettings(body);
    if (!result.ok) {
        return NextResponse.json({error: result.error}, {status: 400});
    }

    return NextResponse.json({
        ok: true,
        updated_at: result.settings.updated_at,
        capabilities: result.settings.capabilities,
        public_contact: result.settings.public_contact,
    });
}
