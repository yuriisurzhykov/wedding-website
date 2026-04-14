import {listGuestAccountsForAdmin} from "@features/admin-rsvp-list";
import {getLocale, getTranslations} from "next-intl/server";

import {
    adminGuestsFilterToAttending,
    type AdminGuestsFilterKey,
} from "../lib/admin-guests-filter";
import {AdminGuestsFilterNav} from "./AdminGuestsFilterNav";
import {AdminGuestsSectionShell} from "./AdminGuestsSectionShell";
import {AdminGuestsTable} from "./AdminGuestsTable";

type Props = Readonly<{
    filter: AdminGuestsFilterKey;
}>;

export async function AdminGuestsSection({filter}: Props) {
    const t = await getTranslations("admin.guests");
    const locale = await getLocale();
    const attending = adminGuestsFilterToAttending(filter);
    const result = await listGuestAccountsForAdmin({attending});

    if (!result.ok) {
        return (
            <AdminGuestsSectionShell title={t("title")}>
                <p className="mt-4 text-body text-red-500" role="alert">
                    {t("loadError")}
                </p>
            </AdminGuestsSectionShell>
        );
    }

    const rows = result.rows;
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
    });

    return (
        <AdminGuestsSectionShell title={t("title")} subtitle={t("subtitle")}>
            <AdminGuestsFilterNav
                filter={filter}
                filtersAriaLabel={t("filtersAria")}
                labelAll={t("filterAll")}
                labelAttending={t("filterAttending")}
                labelNotAttending={t("filterNotAttending")}
            />

            {rows.length === 0 ? (
                <p className="mt-8 text-body text-text-secondary">{t("empty")}</p>
            ) : (
                <AdminGuestsTable
                    rows={rows}
                    t={t}
                    dateFormatter={dateFormatter}
                    emptyDisplay={t("valueEmpty")}
                />
            )}
        </AdminGuestsSectionShell>
    );
}
