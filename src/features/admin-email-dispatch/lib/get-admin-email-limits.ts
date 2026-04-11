import "server-only";

export type AdminEmailLimits = Readonly<{
    /** Max recipients for one broadcast POST (guards serverless timeouts and Resend throughput). */
    maxBroadcastRecipients: number;
    /** Pause between sequential `emails.send` calls (ms). */
    sendDelayMs: number;
}>;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
    const n = Number.parseInt(raw ?? "", 10);
    if (!Number.isFinite(n) || n < 1) {
        return fallback;
    }
    return n;
}

/**
 * Reads optional tuning from env (see feature README).
 */
export function getAdminEmailLimits(): AdminEmailLimits {
    return {
        maxBroadcastRecipients: parsePositiveInt(
            process.env.ADMIN_EMAIL_MAX_BROADCAST_RECIPIENTS,
            250,
        ),
        sendDelayMs: parsePositiveInt(process.env.ADMIN_EMAIL_SEND_DELAY_MS, 75),
    };
}
