import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";

/**
 * Smoke test: server env + DB schema. Remove or protect if you do not want a public probe.
 * GET /api/health/supabase
 */
export async function GET() {
    const url =
        process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const publishableKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    const checks: Record<string, { ok: boolean; detail?: string }> = {};

    if (!url) {
        checks.config = {
            ok: false,
            detail: "Missing SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL",
        };
        return NextResponse.json({ok: false, checks}, {status: 500});
    }

    if (!serviceKey) {
        checks.serviceRole = {
            ok: false,
            detail: "Missing SUPABASE_SERVICE_ROLE_KEY",
        };
        return NextResponse.json({ok: false, checks}, {status: 500});
    }

    const admin = createClient(url, serviceKey);
    const {error: rsvpError} = await admin.from("rsvp").select("id").limit(1);
    checks.serviceRole_rsvp = rsvpError
        ? {ok: false, detail: rsvpError.message}
        : {ok: true};

    if (publishableKey) {
        const anon = createClient(url, publishableKey);
        const {error: photosError} = await anon
            .from("photos")
            .select("id")
            .limit(1);
        checks.publishable_photos_read = photosError
            ? {ok: false, detail: photosError.message}
            : {ok: true};
    } else {
        checks.publishable_photos_read = {
            ok: false,
            detail:
                "No NEXT_PUBLIC_SUPABASE_ANON_KEY / PUBLISHABLE_KEY (skipped anon test)",
        };
    }

    const allOk = Object.values(checks).every((c) => c.ok);
    return NextResponse.json(
        {ok: allOk, checks, ts: new Date().toISOString()},
        {status: allOk ? 200 : 500},
    );
}
