import {Link} from "@/i18n/navigation";
import {listReplyTemplatesForAdmin} from "@features/admin-reply-templates";
import {getTranslations} from "next-intl/server";

import {AdminReplyTemplatesManager} from "./AdminReplyTemplatesManager";

export async function AdminReplyTemplatesSection() {
    const t = await getTranslations("admin.mail.templates");

    const result = await listReplyTemplatesForAdmin();
    if (!result.ok) {
        return (
            <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="font-display text-h2 text-text-primary">{t("title")}</h1>
                    <Link
                        href="/admin/mail"
                        className="text-body font-medium text-primary underline underline-offset-2"
                    >
                        {t("backToInbox")}
                    </Link>
                </div>
                <p className="mt-4 text-body text-red-500" role="alert">
                    {t("loadError")}
                </p>
            </section>
        );
    }

    return (
        <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="font-display text-h2 text-text-primary">{t("title")}</h1>
                <Link
                    href="/admin/mail"
                    className="text-body font-medium text-primary underline underline-offset-2"
                >
                    {t("backToInbox")}
                </Link>
            </div>
            <p className="mt-2 text-body text-text-secondary">{t("subtitle")}</p>
            <div className="mt-8">
                <AdminReplyTemplatesManager initialTemplates={result.rows} />
            </div>
        </section>
    );
}
