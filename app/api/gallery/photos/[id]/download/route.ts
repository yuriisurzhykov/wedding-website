import {NextResponse} from "next/server";
import {z} from "zod";

import {getGalleryPhotoDownload} from "@features/gallery-list";
import {IpRateLimiter, rateLimit} from "@shared/lib";

export const dynamic = "force-dynamic";

type RouteContext = Readonly<{ params: Promise<{ id: string }> }>;

const downloadLimiter = new IpRateLimiter({maxRequests: 60, windowMs: 60_000});

const paramsSchema = z.object({id: z.string().uuid()});

/**
 * GET /api/gallery/photos/[id]/download
 *
 * Same-origin proxy that streams a gallery photo with `Content-Disposition: attachment`,
 * so browsers download it (the cross-origin R2 URL ignores the `download` attribute).
 * Public (photos are public) but rate-limited and gated on `galleryBrowse`.
 */
export async function GET(request: Request, context: RouteContext) {
    const rl = rateLimit(downloadLimiter, request);
    if (!rl.allowed) {
        return NextResponse.json(
            {error: "too_many_requests"},
            {
                status: 429,
                headers: {"Retry-After": String(Math.ceil(rl.retryAfterMs / 1000))},
            },
        );
    }

    const parsed = paramsSchema.safeParse(await context.params);
    if (!parsed.success) {
        return NextResponse.json({error: "invalid_id"}, {status: 400});
    }

    const result = await getGalleryPhotoDownload(parsed.data.id);

    if (!result.ok) {
        if (result.kind === "disabled" || result.kind === "not_found") {
            return NextResponse.json({error: "not_found"}, {status: 404});
        }
        console.error(
            "[api/gallery/photos/download]",
            result.kind,
            "message" in result ? result.message : "",
        );
        return NextResponse.json({error: "server_error"}, {status: 500});
    }

    return new NextResponse(result.bytes as unknown as BodyInit, {
        status: 200,
        headers: {
            "Content-Type": result.contentType,
            "Content-Length": String(result.bytes.byteLength),
            "Content-Disposition": `attachment; filename="${result.filename}"`,
            "Cache-Control": "private, no-store",
        },
    });
}
