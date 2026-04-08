import {createServerClient} from '@shared/api/supabase/server'
import {NextResponse} from "next/server";

/**
 * Lightweight DB keep-alive for Vercel Cron (see vercel.json).
 * GET /api/ping
 */
export async function GET() {
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
