import {listInboundEmailsForAdmin} from "@features/admin-inbox";
import {getTranslations} from "next-intl/server";

import {AdminMailListIsland} from "./AdminMailListIsland";

/**
 * Server-rendered mailbox list (initial page) with a client island for pagination.
 */
export async function AdminMailListSection() {
    const t = await getTranslations("admin.mail");
    const result = await listInboundEmailsForAdmin({limit: 25});

    if (!result.ok) {
        return (
            <div className="rounded-lg border border-border bg-bg-card p-4 shadow-card">
                <p className="text-body text-red-500" role="alert">
                    {t("list.loadError")}
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border bg-bg-card shadow-card">
            <div className="border-b border-border px-3 py-2">
                <h2 className="font-display text-h3 text-text-primary">{t("list.heading")}</h2>
            </div>
            <AdminMailListIsland
                initialEmails={result.emails}
                initialNextCursor={result.nextCursor}
            />
        </div>
    );
}
