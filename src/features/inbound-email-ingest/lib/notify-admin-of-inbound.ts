import "server-only";

import {routing} from "@/i18n/routing";

import {
    createResendClient,
    getAdminEmailForNotifications,
    getResendApiKey,
    getTransactionalFromAddress,
} from "@shared/api/resend";
import {pathForLocale, toAbsoluteUrl} from "@shared/lib/i18n/locale-path";
import {resolvePublicSiteBaseForServerEmail} from "@shared/lib/get-public-site-url";

/**
 * Sends a short admin alert with a link to the inbox row. Fire-and-forget: callers attach `.catch(…)`.
 */
export function notifyAdminOfInboundEmail(input: {
    inboundEmailId: string;
    senderLabel: string;
    request?: Request;
}): Promise<void> {
    const to = getAdminEmailForNotifications();
    const apiKey = getResendApiKey();
    if (!to || !apiKey) {
        return Promise.resolve();
    }

    const base =
        resolvePublicSiteBaseForServerEmail(input.request) ??
        process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (!base) {
        console.warn(
            "[inbound-email-ingest] skip admin notify: no public site URL (NEXT_PUBLIC_SITE_URL / VERCEL_URL / Host)",
        );
        return Promise.resolve();
    }

    const path = pathForLocale(routing.defaultLocale, `/admin/mail/${input.inboundEmailId}`);
    const url = toAbsoluteUrl(base.replace(/\/+$/, ""), path);

    const from = getTransactionalFromAddress();
    const resend = createResendClient(apiKey);
    const subject = `New message from ${input.senderLabel}`;

    const text = `Open in admin: ${url}`;
    const html = `<p>${escapeHtml(subject)}</p><p><a href="${escapeAttr(url)}">Open in admin</a></p>`;

    return resend.emails
        .send({
            from,
            to: [to],
            subject,
            text,
            html,
        })
        .then(({error}) => {
            if (error) {
                throw new Error(error.message);
            }
        });
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
    return escapeHtml(s).replace(/'/g, "&#39;");
}
