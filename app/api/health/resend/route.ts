import {NextResponse} from "next/server";
import {Resend} from "resend";

/**
 * Sends one test email to ADMIN_EMAIL. Auth: header only (never put ADMIN_SECRET in the URL).
 *
 * GET or POST /api/health/resend
 * Header: Authorization: Bearer <ADMIN_SECRET>
 *
 * Example (PowerShell): $h = @{ Authorization = "Bearer <paste ADMIN_SECRET from .env.local>" }; Invoke-RestMethod -Uri http://localhost:3000/api/health/resend -Headers $h
 *
 * RESEND_FROM_EMAIL — optional; default uses Resend sandbox sender (works for quick tests).
 */
function assertBearerAdminSecret(request: Request): NextResponse | null {
    const auth = request.headers.get("authorization");
    const token = auth?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
    const expected = process.env.ADMIN_SECRET?.trim() ?? "";

    if (!expected) {
        return NextResponse.json(
            {ok: false, error: "ADMIN_SECRET is not set"},
            {status: 500},
        );
    }
    if (!token) {
        return NextResponse.json(
            {
                ok: false,
                error: "Missing credential",
                hint: 'Send header: Authorization: Bearer <ADMIN_SECRET> (do not use query params)',
            },
            {status: 401},
        );
    }
    if (token !== expected) {
        return NextResponse.json(
            {ok: false, error: "Invalid secret"},
            {status: 401},
        );
    }
    return null;
}

async function sendTestEmail() {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.ADMIN_EMAIL;

    if (!apiKey) {
        return NextResponse.json(
            {ok: false, error: "RESEND_API_KEY is not set"},
            {status: 500},
        );
    }
    if (!to) {
        return NextResponse.json(
            {ok: false, error: "ADMIN_EMAIL is not set"},
            {status: 500},
        );
    }

    const from =
        process.env.RESEND_FROM_EMAIL?.trim() ??
        "Wedding site <onboarding@resend.dev>";

    const resend = new Resend(apiKey);
    const {data, error} = await resend.emails.send({
        from,
        to: [to],
        subject: "Resend test — wedding site",
        text: "If you received this, Resend + env vars are configured correctly.",
    });

    if (error) {
        return NextResponse.json(
            {ok: false, error: error.message, name: error.name},
            {status: 500},
        );
    }

    return NextResponse.json({
        ok: true,
        id: data?.id,
        ts: new Date().toISOString(),
    });
}

export async function GET(request: Request) {
    const authError = assertBearerAdminSecret(request);
    if (authError) {
        return authError;
    }
    return sendTestEmail();
}

export async function POST(request: Request) {
    const authError = assertBearerAdminSecret(request);
    if (authError) {
        return authError;
    }
    return sendTestEmail();
}
