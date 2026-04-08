import "server-only";

import {S3Client} from "@aws-sdk/client-s3";

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

export type R2UploadConfig = {
    client: S3Client;
    bucket: string;
    /** No trailing slash — used to build public object URLs */
    publicUrlBase: string;
};

/**
 * S3-compatible client and bucket for R2 uploads (presigned PUT).
 * Throws if required env vars are missing.
 */
export function assertR2UploadConfig(): R2UploadConfig {
    const endpoint = r2Endpoint();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
    const bucket = process.env.R2_BUCKET_NAME?.trim();
    const rawPublic = process.env.R2_PUBLIC_URL?.trim();

    if (!endpoint) {
        throw new Error(
            "R2: set R2_ACCOUNT_ID or R2_ACCOUNT_ENDPOINT for uploads",
        );
    }
    if (!accessKeyId || !secretAccessKey || !bucket) {
        throw new Error(
            "R2: missing R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_BUCKET_NAME",
        );
    }
    if (!rawPublic) {
        throw new Error("R2: R2_PUBLIC_URL is required to confirm photo rows");
    }

    const publicUrlBase = rawPublic.replace(/\/+$/, "");

    const client = new S3Client({
        region: "auto",
        endpoint,
        credentials: {accessKeyId, secretAccessKey},
        forcePathStyle: true,
        /** Presigned PUT from the browser: omit default CRC32 query params (simpler CORS). */
        requestChecksumCalculation: "WHEN_REQUIRED",
    });

    return {client, bucket, publicUrlBase};
}
