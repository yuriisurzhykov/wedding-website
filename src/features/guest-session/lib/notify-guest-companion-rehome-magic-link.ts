import "server-only";

import {GUEST_MAGIC_LINK_REHOME_PLACEHOLDER_KEYS} from "@entities/email-template";
import {sendTransactionalEmailFromSlug} from "@features/admin-email-dispatch";
import {createResendClient, getResendApiKey, getTransactionalFromAddress} from "@shared/api/resend";
import {escapeHtml} from "@shared/lib/html-escape";

import {buildGuestRehomeMagicLinkTemplateVars} from "./build-guest-rehome-magic-link-template-vars";
import {type GuestRehomeEmailLocale} from "./rehome-magic-link-email-copy";

const SLUG: Record<GuestRehomeEmailLocale, string> = {
    en: "guest-magic-link-rehome-en",
    ru: "guest-magic-link-rehome-ru",
};

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
    const html = `<!DOCTYPE html><html lang="${locale}"><head><meta charset="utf-8"/></head><body style="margin:0;padding:24px;font-family:${'Lato'},system-ui,sans-serif;color:#2C2420;">
<p style="font-size:18px;">${vars.greeting_html}</p>
<p style="font-size:15px;line-height:1.55;">${escapeHtml(vars.lead)}</p>
${vars.magic_link_html}
<p style="margin-top:24px;font-size:14px;color:#6B5C54;white-space:pre-line;">${vars.sign_off_html}</p>
</body></html>`;

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
