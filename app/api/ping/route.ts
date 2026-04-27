import {createServerClient} from '@shared/api/supabase/server'
import {NextResponse} from "next/server";

import {assertBearer} from "@shared/lib";

/**
 * Lightweight DB keep-alive for Vercel Cron (see vercel.json).
 * Vercel automatically sets `Authorization: Bearer <CRON_SECRET>` for cron invocations.
 * GET /api/ping
 */
export async function GET(request: Request) {
    const authError = assertBearer(request, process.env.CRON_SECRET, "CRON_SECRET");
    if (authError) return authError;
    try {
        const supabase = createServerClient();
        const {error} = await supabase.from("rsvp").select("id").limit(1);
        if (error) {
            return NextResponse.json(
                {ok: false, ts: new Date().toISOString()},
                {status: 500},
            );
        }
        return NextResponse.json({
            ok: true,
            ts: new Date().toISOString(),
        });
    } catch {
        return NextResponse.json(
            {ok: false, ts: new Date().toISOString()},
            {status: 500},
        );
    }
}
