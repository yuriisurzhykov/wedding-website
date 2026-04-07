import {NextResponse} from "next/server";
import {Resend} from "resend";

/**
 * Sends one test email to ADMIN_EMAIL. Guarded by ADMIN_SECRET (same as planned /admin).
 * GET /api/health/resend?secret=<ADMIN_SECRET>
 *
 * RESEND_FROM_EMAIL — optional; default uses Resend sandbox sender (works for quick tests).
 */
export async function GET(request: Request) {
    const {searchParams} = new URL(request.url);
    const secret = searchParams.get("secret");
    const expected = process.env.ADMIN_SECRET;

    if (!expected) {
        return NextResponse.json(
            {ok: false, error: "ADMIN_SECRET is not set"},
            {status: 500},
        );
    }
    if (secret !== expected) {
        return NextResponse.json({ok: false, error: "Unauthorized"}, {status: 401});
    }

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
