import "server-only";

/**
 * Inbound Resend webhook ingest — public API for `app/api/webhooks/resend/inbound` and tests.
 *
 * @see README.md
 */

export {ingestInboundEmail, type IngestInboundEmailResult} from "./api/ingest-inbound-email";
export {
    readSvixHeaders,
    verifySvixSignature,
} from "./lib/verify-svix-signature";
