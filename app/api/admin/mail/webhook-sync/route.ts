import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";
import {
    getResendWebhookPublicUrl,
    getWebhookSubscriptionStatus,
    syncResendInboundWebhook,
} from "@features/resend-webhook-subscription";
import {getSiteSettings} from "@features/site-settings";
import {NextResponse} from "next/server";

/**
 * GET /api/admin/mail/webhook-sync — Resend inbound webhook subscription status (no signing secret).
 * POST /api/admin/mail/webhook-sync — manual sync using `public_contact.email` and `RESEND_WEBHOOK_PUBLIC_URL`.
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

    const result = await getWebhookSubscriptionStatus();
    if (!result.ok) {
        return NextResponse.json({error: result.error}, {status: 500});
    }

    return NextResponse.json({status: result.status});
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

    const endpointUrl = getResendWebhookPublicUrl();
    if (!endpointUrl) {
        return NextResponse.json(
            {error: "RESEND_WEBHOOK_PUBLIC_URL is not configured"},
            {status: 400},
        );
    }

    const settings = await getSiteSettings();
    const filterEmail = settings.public_contact.email.trim();

    const result = await syncResendInboundWebhook({
        filterEmail,
        endpointUrl,
    });

    if (!result.ok) {
        return NextResponse.json({error: result.error}, {status: 500});
    }

    return NextResponse.json({ok: true});
}
