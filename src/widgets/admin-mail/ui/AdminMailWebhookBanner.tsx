import type {WebhookSubscriptionStatus} from "@features/resend-webhook-subscription";
import {getTranslations} from "next-intl/server";

import {AdminMailSyncWebhookButton} from "./AdminMailSyncWebhookButton";

type Props = Readonly<{
    status: WebhookSubscriptionStatus;
    /** Current site `public_contact.email` used as the inbound allow-list. */
    expectedFilterEmail: string;
}>;

export async function AdminMailWebhookBanner({status, expectedFilterEmail}: Props) {
    const t = await getTranslations("admin.mail.webhook");

    const expected = expectedFilterEmail.trim();
    const filter = status.filterEmail?.trim() ?? "";
    const mismatch = Boolean(expected) && filter !== expected;
    const missingWebhook = !status.webhookId;
    const showError = Boolean(status.lastSyncError);
    const showWarn = mismatch || missingWebhook || !status.signingSecretPresent;

    if (!showError && !showWarn) {
        return null;
    }

    return (
        <div
            className={
                showError
                    ? "rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-body text-text-primary"
                    : "rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-body text-text-primary"
            }
            role="status"
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-2">
                    {showError ? (
                        <p>
                            <span className="font-medium">{t("lastErrorLabel")}</span> {status.lastSyncError}
                        </p>
                    ) : null}
                    {missingWebhook ? <p>{t("missingWebhook")}</p> : null}
                    {mismatch ? (
                        <p>
                            {t("filterMismatch", {
                                expected,
                                current: filter || t("filterEmpty"),
                            })}
                        </p>
                    ) : null}
                    {!status.signingSecretPresent ? <p>{t("noSigningSecret")}</p> : null}
                </div>
                <div className="shrink-0">
                    <AdminMailSyncWebhookButton />
                </div>
            </div>
        </div>
    );
}
