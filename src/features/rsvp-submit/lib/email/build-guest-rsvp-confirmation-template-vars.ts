import type {GuestRsvpConfirmationPlaceholderKey} from "@entities/email-template";
import type {RsvpRowInsert} from "@entities/rsvp";
import {VENUE} from "@entities/wedding-venue";
import {formatStoryWeddingLine} from "@shared/lib/wedding-calendar";
import {escapeHtml} from "@shared/lib/html-escape";

import {
    getGuestConfirmationCopy,
    guestConfirmationSubject,
    type GuestEmailLocale,
} from "./guest-confirmation-copy";
import {buildGuestConfirmationMagicLinkEmailParts} from "./guest-confirmation-magic-link-email-parts";
import {normalizeOptionalHttpsUrl} from "./normalize-optional-https-url";
import {WEDDING_EMAIL_THEME as T} from "./wedding-email-theme";

/** String values for `{{key}}` substitution in guest RSVP confirmation DB templates. */
export type GuestRsvpConfirmationTemplateVars = Record<
    GuestRsvpConfirmationPlaceholderKey,
    string
>;

function venueLines(locale: GuestEmailLocale): { title: string; lines: string[] } {
    const c = getGuestConfirmationCopy(locale);
    const ceremony = formatStoryWeddingLine(locale);
    const parts: string[] = [ceremony];
    const venueTitle = VENUE.name?.trim()
        ? `${VENUE.name.trim()} — ${VENUE.address}`
        : VENUE.address;
    if (venueTitle.trim()) {
        parts.push(venueTitle.trim());
    }
    return {title: `${c.ceremonyLabel} & ${c.venueLabel}`, lines: parts};
}

function optionalBlockText(
    label: string,
    value: string | null | undefined,
): string | null {
    const v = value?.trim();
    if (!v) return null;
    return `${label}: ${v}`;
}

/**
 * Pre-computed fragments for transactional guest RSVP templates (`guest-rsvp-confirmation-en` / `ru`).
 * Mirrors the dynamic pieces of {@link buildGuestConfirmationEmail}; HTML-oriented fields are escaped where the
 * monolithic builder escaped them.
 *
 * @param row — Stored RSVP row; callers should only invoke when `row.email` is non-empty.
 * @param locale — Language the guest used on the form.
 * @param _siteUrl — Reserved for future “open site” CTA in templates; unused for current placeholder set.
 * @param magicLinkClaimUrl — Optional `GET /api/guest/claim` URL; empty magic-link placeholders when absent.
 */
export function buildGuestRsvpConfirmationTemplateVars(
    row: RsvpRowInsert,
    locale: GuestEmailLocale,
    _siteUrl?: string,
    magicLinkClaimUrl?: string,
): GuestRsvpConfirmationTemplateVars {
    const copy = getGuestConfirmationCopy(locale);
    const subject = guestConfirmationSubject(row, locale);

    const greetingText = copy.greeting(row.name);
    const greetingHtml = escapeHtml(greetingText);

    const lead = row.attending ? copy.leadAttending : copy.leadNotAttending;
    const summary = row.attending
        ? copy.summaryAttending(row.guest_count)
        : copy.summaryNotAttending;

    const {title: whenWhereTitle, lines: whenWhereLines} = venueLines(locale);
    const whenWhereBodyHtml = whenWhereLines
        .map((line) => `<p style="margin:0 0 6px 0;">${escapeHtml(line)}</p>`)
        .join("");
    const whenWhereBodyText = whenWhereLines.join("\n");

    const extrasLines = [
        optionalBlockText(copy.dietaryLabel, row.dietary),
        optionalBlockText(copy.messageLabel, row.message),
    ].filter(Boolean) as string[];

    const extrasHtml =
        extrasLines.length > 0
            ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid ${T.border};font-family:${T.fontBody};font-size:14px;color:${T.textSecondary};">${extrasLines
                  .map(
                      (line) =>
                          `<p style="margin:0 0 8px 0;color:${T.textPrimary};">${escapeHtml(line)}</p>`,
                  )
                  .join("")}</div>`
            : "";

    const extrasText = extrasLines.length > 0 ? extrasLines.join("\n") : "";

    const normalizedMagic = normalizeOptionalHttpsUrl(magicLinkClaimUrl);
    const magicParts = normalizedMagic
        ? buildGuestConfirmationMagicLinkEmailParts(
              {
                  magicLinkIntro: copy.magicLinkIntro,
                  magicLinkButton: copy.magicLinkButton,
              },
              normalizedMagic,
          )
        : null;

    const magicLinkHtml = magicParts?.htmlBlock ?? "";
    const magicLinkText = magicParts ? magicParts.textAppend.join("\n") : "";

    const signOffText = copy.signOff;
    const signOffHtml = escapeHtml(signOffText);

    return {
        subject,
        greeting_html: greetingHtml,
        greeting_text: greetingText,
        lead,
        summary,
        when_where_title: whenWhereTitle,
        when_where_body_html: whenWhereBodyHtml,
        when_where_body_text: whenWhereBodyText,
        extras_html: extrasHtml,
        extras_text: extrasText,
        magic_link_html: magicLinkHtml,
        magic_link_text: magicLinkText,
        sign_off_html: signOffHtml,
        sign_off_text: signOffText,
    };
}
