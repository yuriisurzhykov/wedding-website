import "server-only";

import {routing} from "@/i18n/routing";

import {formatSenderDisplay} from "@entities/inbound-email";
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
 *
 * Subject uses the display name when known; body always spells out both
 * `From: Name <addr>` and the original `Subject:` so the admin can triage from
 * the notification alone.
 */
export function notifyAdminOfInboundEmail(input: {
    inboundEmailId: string;
    senderName: string | null;
    senderAddress: string;
    originalSubject: string | null;
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

    const senderDisplay = formatSenderDisplay({
        from_name: input.senderName,
        from_address: input.senderAddress,
    });
    const senderSubjectPart = input.senderName?.trim() || input.senderAddress;
    const subject = `New message from ${senderSubjectPart}`;
    const originalSubject = input.originalSubject?.trim() || "(No subject)";

    const text = [
        `From: ${senderDisplay}`,
        `Subject: ${originalSubject}`,
        "",
        `Open in admin: ${url}`,
    ].join("\n");

    const html = [
        `<p><strong>From:</strong> ${escapeHtml(senderDisplay)}</p>`,
        `<p><strong>Subject:</strong> ${escapeHtml(originalSubject)}</p>`,
        `<p><a href="${escapeAttr(url)}">Open in admin</a></p>`,
    ].join("");

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
