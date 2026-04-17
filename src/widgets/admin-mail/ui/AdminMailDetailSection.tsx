import {getInboundEmailForAdmin} from "@features/admin-inbox";
import {listReplyTemplatesForAdmin} from "@features/admin-reply-templates";
import {getTranslations} from "next-intl/server";

import {AdminMailDetailPanel} from "./AdminMailDetailPanel";

type Props = Readonly<{
    id: string;
}>;

export async function AdminMailDetailSection({id}: Props) {
    const t = await getTranslations("admin.mail");

    const [detail, templatesResult] = await Promise.all([
        getInboundEmailForAdmin(id),
        listReplyTemplatesForAdmin(),
    ]);

    if (!detail.ok) {
        if (detail.kind === "not_found") {
            return (
                <div className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
                    <p className="text-body text-text-secondary">{t("detail.notFound")}</p>
                </div>
            );
        }
        return (
            <div className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
                <p className="text-body text-red-500" role="alert">
                    {t("detail.loadError")}
                </p>
            </div>
        );
    }

    const templates = templatesResult.ok ? templatesResult.rows : [];

    return (
        <AdminMailDetailPanel
            email={detail.email}
            attachments={detail.attachments}
            templates={templates}
        />
    );
}
