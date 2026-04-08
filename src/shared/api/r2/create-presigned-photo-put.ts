import "server-only";

import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {randomUUID} from "crypto";

import {assertR2UploadConfig} from "./r2-config";

/**
 * Issues a short-lived presigned PUT URL and a unique `photos/…` object key.
 */
export async function createPresignedPhotoPutUrl(
    contentType: string,
): Promise<{url: string; key: string}> {
    const {client, bucket} = assertR2UploadConfig();
    const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const key = `photos/${randomUUID()}.${ext}`;

    const url = await getSignedUrl(
        client,
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
        }),
        {expiresIn: 300},
    );

    return {url, key};
}
