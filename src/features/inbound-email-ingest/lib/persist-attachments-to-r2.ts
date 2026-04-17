import "server-only";

import {PutObjectCommand} from "@aws-sdk/client-s3";
import {randomUUID} from "node:crypto";

import {assertR2UploadConfig} from "@shared/api/r2";

import type {ResendReceivedAttachmentRow} from "./fetch-resend-received-email";

export type PersistedInboundAttachment = {
    filename: string;
    content_type: string | null;
    size_bytes: number | null;
    r2_key: string;
    r2_public_url: string | null;
};

/** Max size per attachment stored from inbound mail (bytes). */
export const INBOUND_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/plain",
]);

function normalizeContentType(raw: string | null | undefined): string | null {
    if (!raw?.trim()) {
        return null;
    }
    return raw.split(";")[0]?.trim().toLowerCase() ?? null;
}

function isAllowedContentType(ct: string | null): ct is string {
    return ct !== null && ALLOWED_CONTENT_TYPES.has(ct);
}

function sanitizeFilename(name: string): string {
    const base = name.replace(/[/\\?%*:|"<>]/g, "_").trim() || "attachment";
    return base.slice(0, 200);
}

/**
 * Downloads each attachment from Resend signed URLs and stores objects under `inbound-mail/<emailId>/…`.
 *
 * Skips attachments over {@link INBOUND_ATTACHMENT_MAX_BYTES} or with disallowed content types (logged).
 */
export async function persistInboundAttachmentsToR2(input: {
    inboundEmailId: string;
    rows: ResendReceivedAttachmentRow[];
}): Promise<PersistedInboundAttachment[]> {
    const {client, bucket, publicUrlBase} = assertR2UploadConfig();
    const persisted: PersistedInboundAttachment[] = [];

    for (const row of input.rows) {
        const ct = normalizeContentType(row.content_type);
        if (!isAllowedContentType(ct)) {
            console.warn(
                `[inbound-email-ingest] skip attachment (type): ${row.filename} (${row.content_type ?? "unknown"})`,
            );
            continue;
        }

        const fileRes = await fetch(row.download_url);
        if (!fileRes.ok) {
            console.error(
                `[inbound-email-ingest] attachment download failed: ${row.filename} HTTP ${fileRes.status}`,
            );
            continue;
        }

        const buf = Buffer.from(await fileRes.arrayBuffer());
        if (buf.byteLength > INBOUND_ATTACHMENT_MAX_BYTES) {
            console.warn(
                `[inbound-email-ingest] skip attachment (size): ${row.filename} (${buf.byteLength} bytes)`,
            );
            continue;
        }

        const safeName = sanitizeFilename(row.filename);
        const key = `inbound-mail/${input.inboundEmailId}/${randomUUID()}-${safeName}`;

        await client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: buf,
                ContentType: ct,
            }),
        );

        persisted.push({
            filename: row.filename,
            content_type: ct,
            size_bytes: buf.byteLength,
            r2_key: key,
            r2_public_url: `${publicUrlBase}/${key}`,
        });
    }

    return persisted;
}
