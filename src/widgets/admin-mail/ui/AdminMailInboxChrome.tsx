import {Link} from "@/i18n/navigation";
import {
    getResendWebhookPublicUrl,
    getWebhookSubscriptionStatus,
    syncResendInboundWebhook,
} from "@features/resend-webhook-subscription";
import {getSiteSettings} from "@features/site-settings";
import {getTranslations} from "next-intl/server";
import type {ReactNode} from "react";

import {AdminMailWebhookBanner} from "./AdminMailWebhookBanner";

type Props = Readonly<{
    children: ReactNode;
}>;

/**
 * Page chrome for inbox routes: title, link to templates, webhook health banner.
 */
export async function AdminMailInboxChrome({children}: Props) {
    const t = await getTranslations("admin.mail");
    const [settings, wh] = await Promise.all([getSiteSettings(), getWebhookSubscriptionStatus()]);

    const expectedEmail = settings.public_contact.email.trim();
    const endpointUrl = getResendWebhookPublicUrl();

    if (endpointUrl && expectedEmail && wh.ok) {
        const needsSync =
            !wh.status.webhookId || wh.status.filterEmail?.trim() !== expectedEmail;
        if (needsSync) {
            void syncResendInboundWebhook({
                filterEmail: expectedEmail,
                endpointUrl,
            }).catch((e) => {
                console.error("[admin-mail] resend webhook auto-sync failed", e);
            });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-h2 text-text-primary">{t("title")}</h1>
                    <p className="mt-2 text-body text-text-secondary">{t("subtitle")}</p>
                </div>
                <Link
                    href="/admin/mail/templates"
                    className="text-body font-medium text-primary underline underline-offset-2"
                >
                    {t("manageTemplates")}
                </Link>
            </div>

            {!wh.ok ? (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-body text-text-primary">
                    {t("webhook.statusLoadFailed", {message: wh.error})}
                </div>
            ) : (
                <AdminMailWebhookBanner status={wh.status} expectedFilterEmail={expectedEmail} />
            )}

            {children}
        </div>
    );
}
