import "server-only";

import {DeleteObjectCommand} from "@aws-sdk/client-s3";

import {assertR2UploadConfig} from "./r2-config";

/**
 * Removes an object from the configured R2 bucket (same client as uploads).
 */
export async function deleteR2Object(
    key: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
    let config;
    try {
        config = assertR2UploadConfig();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, message};
    }

    try {
        await config.client.send(
            new DeleteObjectCommand({
                Bucket: config.bucket,
                Key: key,
            }),
        );
        return {ok: true};
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, message};
    }
}
