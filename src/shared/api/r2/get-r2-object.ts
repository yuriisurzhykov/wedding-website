import "server-only";

import {GetObjectCommand} from "@aws-sdk/client-s3";

import {assertR2UploadConfig} from "./r2-config";

export type GetR2ObjectResult =
    | { ok: true; bytes: Uint8Array; contentType: string }
    | { ok: false; kind: "not_found" | "config" | "error"; message: string };

/**
 * Reads an object from the configured R2 bucket (same client as uploads).
 *
 * Returns the full body as bytes (gallery photos are small) plus its stored
 * `Content-Type`, so a route can re-serve it same-origin with an attachment
 * disposition. A missing key yields `kind: "not_found"`.
 */
export async function getR2Object(key: string): Promise<GetR2ObjectResult> {
    let config;
    try {
        config = assertR2UploadConfig();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    try {
        const response = await config.client.send(
            new GetObjectCommand({Bucket: config.bucket, Key: key}),
        );
        if (!response.Body) {
            return {ok: false, kind: "not_found", message: "Empty object body"};
        }
        const bytes = await response.Body.transformToByteArray();
        return {
            ok: true,
            bytes,
            contentType: response.ContentType ?? "application/octet-stream",
        };
    } catch (e) {
        const name = e instanceof Error ? e.name : "";
        if (name === "NoSuchKey" || name === "NotFound") {
            return {ok: false, kind: "not_found", message: name};
        }
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "error", message};
    }
}
