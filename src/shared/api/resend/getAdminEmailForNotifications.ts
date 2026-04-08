import "server-only";

/**
 * Admin inbox for transactional email (health checks, RSVP alerts, etc.).
 *
 * @returns Trimmed `ADMIN_EMAIL`, or `undefined` if unset or blank.
 */
export function getAdminEmailForNotifications(): string | undefined {
    const to = process.env.ADMIN_EMAIL?.trim();
    return to || undefined;
}
