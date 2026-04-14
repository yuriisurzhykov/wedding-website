import "server-only";

import {GUEST_MAGIC_LINK_REHOME_PLACEHOLDER_KEYS} from "@entities/email-template";
import {sendTransactionalEmailFromSlug} from "@features/admin-email-dispatch";
import {createResendClient, getResendApiKey, getTransactionalFromAddress} from "@shared/api/resend";
import {escapeHtml} from "@shared/lib/html-escape";

import {
    buildGuestRehomeMagicLinkTemplateVars,
    type GuestRehomeMagicLinkTemplateVars,
} from "./build-guest-rehome-magic-link-template-vars";
import {type GuestRehomeEmailLocale} from "./rehome-magic-link-email-copy";

const SLUG: Record<GuestRehomeEmailLocale, string> = {
    en: "guest-magic-link-rehome-en",
    ru: "guest-magic-link-rehome-ru",
};

/** Duplicates `email_templates` rehome shell when the row is missing (see `guest_magic_link_rehome_email_visual_align` migration). */
function buildRehomeMagicLinkFallbackEmailHtml(locale: GuestRehomeEmailLocale, vars: GuestRehomeMagicLinkTemplateVars): string {
    const subjectEsc = escapeHtml(vars.subject);
    return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Lato:wght@300;400;700&display=swap" rel="stylesheet"/>
<title>${subjectEsc}</title>
</head>
<body style="margin:0;padding:40px 16px;background-color:#F5F0E7;font-family:'Lato',system-ui,-apple-system,sans-serif;color:#404040;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td align="center" style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;border-collapse:collapse;background-color:#FFFFFF;border-radius:8px;overflow:hidden;border:1px solid #DDD4CB;box-shadow:0 10px 40px rgba(64,64,64,0.04);">
<tr>
<td style="height:6px;line-height:6px;font-size:0;background-color:#758461;">&nbsp;</td>
</tr>
<tr>
<td style="padding:48px 36px 64px 36px;">

<h1 style="margin:0 0 20px 0;text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#404040;letter-spacing:0.03em;line-height:1.25;">
${vars.greeting_html}
</h1>

<p style="margin:0 0 16px 0;text-align:left;font-family:'Lato',Arial,sans-serif;font-size:15px;line-height:1.65;color:#70645C;font-weight:300;">
${escapeHtml(vars.lead)}
</p>

${vars.magic_link_html}

<p style="margin:40px 0 0 0;padding:0 8px 12px 8px;text-align:center;font-family:'Great Vibes','Cormorant Garamond',Georgia,serif;font-size:34px;line-height:1.4;color:#404040;white-space:pre-line;mso-line-height-rule:exactly;-webkit-text-size-adjust:100%;">
${vars.sign_off_html}
</p>

</td>
</tr>
</table>
</td>
</tr>
</table>

</body>
</html>`;
}

async function sendRehomeFallbackResend(
    to: string,
    displayName: string,
    locale: GuestRehomeEmailLocale,
    claimUrl: string,
): Promise<void> {
    const apiKey = getResendApiKey();
    if (!apiKey) {
        throw new Error("RESEND_API_KEY is not set");
    }
    const vars = buildGuestRehomeMagicLinkTemplateVars(displayName, locale, claimUrl);
    const text = [
        vars.greeting_text,
        "",
        vars.lead,
        vars.magic_link_text,
        "",
        vars.sign_off_text,
    ].join("\n");
    const html = buildRehomeMagicLinkFallbackEmailHtml(locale, vars);

    const resend = createResendClient(apiKey);
    const {error} = await resend.emails.send({
        from: getTransactionalFromAddress(),
        to: [to],
        subject: vars.subject,
        html,
        text,
    });
    if (error) {
        throw new Error(`Resend: ${error.message}`);
    }
}

/**
 * Sends the magic-link email after a companion rebound their mailbox. Fire-and-forget from the route;
 * failures are logged by callers.
 */
export async function notifyGuestCompanionRehomeMagicLink(input: {
    to: string;
    displayName: string;
    locale: GuestRehomeEmailLocale;
    magicLinkClaimUrl: string;
}): Promise<void> {
    const to = input.to.trim();
    if (!to) {
        return;
    }

    const slug = SLUG[input.locale];
    const vars = buildGuestRehomeMagicLinkTemplateVars(
        input.displayName,
        input.locale,
        input.magicLinkClaimUrl,
    );

    const transactional = await sendTransactionalEmailFromSlug({
        slug,
        to,
        vars,
        segment: "transactional:guest-rehome-magic-link",
        placeholderAllowlist: GUEST_MAGIC_LINK_REHOME_PLACEHOLDER_KEYS,
    });

    if (transactional.ok) {
        return;
    }

    if (transactional.kind === "not_found") {
        console.warn("[guest-session] Rehome magic-link template missing; using code fallback.", {slug});
        await sendRehomeFallbackResend(to, input.displayName, input.locale, input.magicLinkClaimUrl);
        return;
    }

    if (transactional.kind === "resend_unconfigured") {
        throw new Error("RESEND_API_KEY is not set");
    }

    if (transactional.kind === "resend") {
        throw new Error(transactional.message ? `Resend: ${transactional.message}` : "Resend send failed");
    }

    const detail = transactional.message ?? transactional.kind;
    throw new Error(`Cannot send rehome magic link: ${detail}`);
}
