import type {RsvpRowInsert} from "@entities/rsvp";
import {escapeHtml} from "@shared/lib/html-escape";

import {WEDDING_EMAIL_GOOGLE_FONTS_HREF, WEDDING_EMAIL_THEME as T,} from "./wedding-email-theme";

/** Parts passed to Resend `emails.send` for the admin RSVP notification (multipart/alternative). */
export type AdminRsvpEmailPayload = {
    subject: string;
    html: string;
    text: string;
};

function dashIfEmpty(value: string | null | undefined): string {
    if (value === null || value === undefined || value.trim() === "") {
        return "—";
    }
    return value;
}

/**
 * Plain-text body for the admin notification (Resend `text` part — searchable, plain-text clients).
 * Not duplicated inside the HTML body.
 *
 * @returns Line-oriented summary including the new row `id`.
 */
export function buildAdminRsvpPlainText(row: RsvpRowInsert, id: string): string {
    const lines = [
        `New RSVP (${id})`,
        `Name: ${row.name}`,
        `Attending: ${row.attending ? "yes" : "no"}`,
        `Guest count: ${row.guest_count}`,
        row.email ? `Email: ${row.email}` : null,
        row.phone ? `Phone: ${row.phone}` : null,
        row.dietary ? `Dietary: ${row.dietary}` : null,
        row.message ? `Message: ${row.message}` : null,
    ].filter(Boolean) as string[];
    return lines.join("\n");
}

function adminTableRow(label: string, valueHtml: string): string {
    return `<tr>
<td style="padding:10px 10px 10px 0;color:${T.textSecondary};width:1%;vertical-align:top;border-bottom:1px solid ${T.border};font-family:${T.fontBody};font-size:14px;white-space:nowrap;"><b>${label}</b></td>
<td style="padding:10px 0 10px 12px;color:${T.textPrimary};border-bottom:1px solid ${T.border};font-family:${T.fontBody};font-size:14px;word-break:break-word;">${valueHtml}</td>
</tr>`;
}

/**
 * Builds multipart content for the admin RSVP notification email (HTML + plain text).
 *
 * All user-supplied field values are HTML-escaped in the HTML part.
 *
 * @param row — Persisted insert shape (same fields as the `rsvp` table minus id/timestamps).
 * @param id — New row UUID from Supabase.
 * @returns {@link AdminRsvpEmailPayload} for `notifyAdminOfNewRsvp` → Resend.
 */
export function buildAdminRsvpEmail(
    row: RsvpRowInsert,
    id: string,
): AdminRsvpEmailPayload {
    const statusLabel = row.attending ? "Attending" : "Not attending";
    const subject = `RSVP: ${row.name} — ${row.attending ? "attending" : "not attending"}`;
    const text = buildAdminRsvpPlainText(row, id);

    const badgeBg = row.attending ? T.primaryLight : T.bgSection;
    const badgeText = row.attending ? T.textPrimary : T.textSecondary;
    const badgeHtml = `<span style="display:inline-block;padding:6px 14px;border-radius:9999px;background:${badgeBg};color:${badgeText};font-family:${T.fontBody};font-size:13px;font-weight:600;">${escapeHtml(statusLabel)}</span>`;

    const nameSafe = escapeHtml(row.name);
    const guestCountStr = String(row.guest_count);
    const emailCell = escapeHtml(dashIfEmpty(row.email ?? undefined));
    const phoneCell = escapeHtml(dashIfEmpty(row.phone ?? undefined));
    const dietaryCell = escapeHtml(dashIfEmpty(row.dietary ?? undefined));
    const messageCell = escapeHtml(dashIfEmpty(row.message ?? undefined));

    const rowsHtml = [
        adminTableRow("Status", badgeHtml),
        adminTableRow("Name", nameSafe),
        adminTableRow("Guests", escapeHtml(guestCountStr)),
        adminTableRow("Email", emailCell),
        adminTableRow("Phone", phoneCell),
        adminTableRow("Dietary", dietaryCell),
        adminTableRow("Message", messageCell.replace(/\n/g, "<br/>")),
    ].join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="stylesheet" href="${WEDDING_EMAIL_GOOGLE_FONTS_HREF}"/>
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${T.bgBase};font-family:${T.fontBody};color:${T.textPrimary};-webkit-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:${T.bgBase};">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:600px;margin:0 auto;background:${T.white};border-radius:12px;overflow:hidden;border:1px solid ${T.border};box-shadow:0 4px 24px rgba(44,36,32,0.08);">
<tr><td style="padding:28px 24px 24px 24px;">
<h1 style="margin:0 0 12px 0;font-family:${T.fontDisplay};font-size:24px;line-height:1.25;font-weight:600;color:${T.primary};border-bottom:1px solid ${T.border};padding-bottom:12px;">New RSVP — ${nameSafe}</h1>
<p style="margin:0 0 20px 0;font-family:${T.fontBody};font-size:14px;color:${T.textSecondary};">Row ID: <code style="background:${T.bgSection};padding:2px 6px;border-radius:4px;font-size:13px;word-break:break-all;">${escapeHtml(id)}</code></p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
</td></tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

    return {subject, html, text};
}
