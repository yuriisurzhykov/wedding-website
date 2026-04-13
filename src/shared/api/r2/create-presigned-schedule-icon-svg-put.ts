import "server-only";

import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {randomUUID} from "crypto";

import {assertR2UploadConfig} from "./r2-config";

const SVG_CONTENT_TYPE = "image/svg+xml";

/**
 * Presigned browser `PUT` for a single SVG object under `schedule-icons/…`.
 * Caller must validate byte size before issuing the URL.
 */
export async function createPresignedScheduleIconSvgPutUrl(): Promise<{
    url: string;
    key: string;
    publicUrl: string;
}> {
    const {client, bucket, publicUrlBase} = assertR2UploadConfig();
    const key = `schedule-icons/${randomUUID()}.svg`;

    const url = await getSignedUrl(
        client,
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: SVG_CONTENT_TYPE,
        }),
        {expiresIn: 300},
    );

    return {url, key, publicUrl: `${publicUrlBase}/${key}`};
}
