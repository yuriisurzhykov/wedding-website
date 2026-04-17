import "server-only";

/**
 * Public HTTPS URL of the inbound webhook handler (must match what Resend calls).
 * Declared in `.env` as `RESEND_WEBHOOK_PUBLIC_URL` per ARCHITECTURE.md.
 */
export function getResendWebhookPublicUrl(): string | undefined {
    const u = process.env.RESEND_WEBHOOK_PUBLIC_URL?.trim();
    return u || undefined;
}

/**
 * Expected hostname for inbound webhook URLs (e.g. `yuriimariia.wedding`).
 * Used to reject accidental sync to the wrong deployment.
 */
export function getResendInboundDomain(): string | undefined {
    const d = process.env.RESEND_INBOUND_DOMAIN?.trim().toLowerCase();
    return d || undefined;
}
