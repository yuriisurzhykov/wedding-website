import {ListObjectsV2Command, S3Client} from "@aws-sdk/client-s3";
import {NextResponse} from "next/server";

import {assertBearer} from "@shared/lib";

function r2Endpoint(): string | null {
    const fromEnv = process.env.R2_ACCOUNT_ENDPOINT?.trim();
    if (fromEnv) {
        return fromEnv.replace(/\/$/, "");
    }
    const id = process.env.R2_ACCOUNT_ID?.trim();
    if (!id) {
        return null;
    }
    return `https://${id}.r2.cloudflarestorage.com`;
}

/**
 * Smoke test: S3 API credentials + bucket.
 * GET /api/health/r2
 * Header: Authorization: Bearer <ADMIN_SECRET>
 */
export async function GET(request: Request) {
    const authError = assertBearer(request, process.env.ADMIN_SECRET, "ADMIN_SECRET");
    if (authError) return authError;
    const endpoint = r2Endpoint();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL?.trim();

    const checks: Record<string, { ok: boolean; detail?: string }> = {};

    if (!endpoint) {
        checks.config = {
            ok: false,
            detail: "Set R2_ACCOUNT_ID or R2_ACCOUNT_S3_ENDPOINT",
        };
        return NextResponse.json({ok: false, checks}, {status: 500});
    }
    if (!accessKeyId || !secretAccessKey || !bucket) {
        checks.config = {
            ok: false,
            detail:
                "Missing R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_BUCKET_NAME",
        };
        return NextResponse.json({ok: false, checks}, {status: 500});
    }

    checks.publicUrl = publicUrl
        ? {ok: true}
        : {ok: false, detail: "R2_PUBLIC_URL not set (needed for photo links)"};

    const client = new S3Client({
        region: "auto",
        endpoint,
        credentials: {accessKeyId, secretAccessKey},
        forcePathStyle: true,
    });

    try {
        await client.send(
            new ListObjectsV2Command({Bucket: bucket, MaxKeys: 1}),
        );
        checks.s3_list = {ok: true};
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        checks.s3_list = {ok: false, detail: msg};
    }

    const s3Ok = checks.s3_list?.ok === true;
    const allOk = s3Ok && Boolean(publicUrl);

    return NextResponse.json(
        {ok: allOk, checks, ts: new Date().toISOString()},
        {status: s3Ok ? 200 : 500},
    );
}
