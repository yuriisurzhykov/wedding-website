import {ingestInboundEmail} from "@features/inbound-email-ingest";
import {NextResponse} from "next/server";

export const dynamic = "force-dynamic";

/** Reject oversized bodies before buffering full text (Svix JSON payloads are small). */
const MAX_WEBHOOK_BODY_BYTES = 512 * 1024;

/**
 * POST /api/webhooks/resend/inbound
 *
 * Public Resend `email.received` webhook. Verifies **Svix** inside {@link ingestInboundEmail}; maps errors to HTTP per
 * `src/features/inbound-email-ingest/README.md` (401 invalid signature, 400 bad payload; transient failures → **200** so
 * Resend does not retry storms).
 */
export async function POST(request: Request) {
    const len = request.headers.get("content-length");
    if (len) {
        const n = Number(len);
        if (Number.isFinite(n) && n > MAX_WEBHOOK_BODY_BYTES) {
            return NextResponse.json({error: "payload_too_large"}, {status: 413});
        }
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_WEBHOOK_BODY_BYTES) {
        return NextResponse.json({error: "payload_too_large"}, {status: 413});
    }

    const result = await ingestInboundEmail({
        rawBody,
        headers: request.headers,
        request,
    });

    if (result.ok) {
        if (result.kind === "stored") {
            return NextResponse.json({ok: true, kind: "stored"}, {status: 200});
        }
        if (result.kind === "duplicate") {
            return NextResponse.json({ok: true, kind: "duplicate"}, {status: 200});
        }
        return NextResponse.json({ok: true, kind: "skipped", reason: result.reason}, {status: 200});
    }

    if (result.kind === "signature") {
        return NextResponse.json({error: "unauthorized"}, {status: 401});
    }

    if (result.kind === "invalid_json") {
        return NextResponse.json({error: "invalid_json"}, {status: 400});
    }

    if (result.kind === "validation") {
        console.warn(
            "[api/webhooks/resend/inbound] validation:",
            result.message,
        );
        return NextResponse.json({error: "invalid_payload"}, {status: 400});
    }

    console.error(
        `[api/webhooks/resend/inbound] ${result.kind}:`,
        result.message,
    );
    return NextResponse.json({ok: false, error: "ingest_failed"}, {status: 200});
}
