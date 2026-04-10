import "server-only";

import {PutObjectCommand} from "@aws-sdk/client-s3";
import {randomUUID} from "crypto";

import type {GalleryAllowedContentType} from "@entities/photo";
import {assertR2UploadConfig} from "@shared/api/r2";

/**
 * Writes bytes to R2 (server-side). Same key layout as presigned uploads (`photos/<uuid>.<ext>`).
 */
export async function putGalleryPhotoToR2(input: {
    contentType: GalleryAllowedContentType;
    body: Buffer;
}): Promise<{ key: string; publicUrl: string }> {
    const {client, bucket, publicUrlBase} = assertR2UploadConfig();
    const ext =
        input.contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const key = `photos/${randomUUID()}.${ext}`;

    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: input.body,
            ContentType: input.contentType,
        }),
    );

    return {key, publicUrl: `${publicUrlBase}/${key}`};
}
