import "server-only";

/**
 * Verified sender for Resend transactional email.
 *
 * Uses `RESEND_FROM_EMAIL` when set. Otherwise falls back to Resend’s onboarding
 * sender so local smoke tests work without a verified domain (same policy as
 * `app/api/health/resend`).
 *
 * @see https://resend.com/docs/dashboard/domains/introduction
 */
export function getTransactionalFromAddress(): string {
    return (
        process.env.RESEND_FROM_EMAIL?.trim() ??
        "Yurii Mariia <onboarding@resend.dev>"
    );
}
