import {Link} from "@/i18n/navigation";
import {listRsvpsForAdmin} from "@features/admin-rsvp-list";
import {cn} from "@shared/lib/cn";
import {getLocale, getTranslations} from "next-intl/server";
import type {ReactNode} from "react";

type FilterKey = "all" | "attending" | "notAttending";

type Props = Readonly<{
    filter: FilterKey;
}>;

function filterToAttending(
    key: FilterKey,
): boolean | undefined {
    if (key === "all") {
        return undefined;
    }
    return key === "attending";
}

function FilterLink({
    href,
    active,
    children,
}: Readonly<{
    href: string;
    active: boolean;
    children: ReactNode;
}>) {
    return (
        <Link
            href={href}
            className={cn(
                "rounded-md px-3 py-1.5 text-small transition-colors",
                active
                    ? "bg-primary text-text-on-primary shadow-button"
                    : "border border-border bg-bg-base text-text-secondary hover:bg-bg-section hover:text-text-primary",
            )}
            aria-current={active ? "true" : undefined}
        >
            {children}
        </Link>
    );
}

export async function AdminGuestsSection({filter}: Props) {
    const t = await getTranslations("admin.guests");
    const locale = await getLocale();
    const attending = filterToAttending(filter);
    const result = await listRsvpsForAdmin({attending});

    if (!result.ok) {
        return (
            <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
                <h1 className="font-display text-h2 text-text-primary">
                    {t("title")}
                </h1>
                <p className="mt-4 text-body text-red-500" role="alert">
                    {t("loadError")}
                </p>
            </section>
        );
    }

    const rows = result.rows;
    const dateFmt = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
    });

    return (
        <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
            <h1 className="font-display text-h2 text-text-primary">{t("title")}</h1>
            <p className="mt-2 text-body text-text-secondary">{t("subtitle")}</p>

            <nav
                className="mt-6 flex flex-wrap gap-2"
                aria-label={t("filtersAria")}
            >
                <FilterLink href="/admin/guests" active={filter === "all"}>
                    {t("filterAll")}
                </FilterLink>
                <FilterLink
                    href="/admin/guests?attending=true"
                    active={filter === "attending"}
                >
                    {t("filterAttending")}
                </FilterLink>
                <FilterLink
                    href="/admin/guests?attending=false"
                    active={filter === "notAttending"}
                >
                    {t("filterNotAttending")}
                </FilterLink>
            </nav>

            {rows.length === 0 ? (
                <p className="mt-8 text-body text-text-secondary">{t("empty")}</p>
            ) : (
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left text-body">
                        <thead>
                            <tr className="border-b border-border text-small text-text-muted">
                                <th className="py-2 pr-4 font-medium">
                                    {t("columns.name")}
                                </th>
                                <th className="py-2 pr-4 font-medium">
                                    {t("columns.email")}
                                </th>
                                <th className="py-2 pr-4 font-medium">
                                    {t("columns.phone")}
                                </th>
                                <th className="py-2 pr-4 font-medium">
                                    {t("columns.attending")}
                                </th>
                                <th className="py-2 pr-4 font-medium">
                                    {t("columns.guestCount")}
                                </th>
                                <th className="py-2 pr-4 font-medium">
                                    {t("columns.dietary")}
                                </th>
                                <th className="py-2 pr-4 font-medium">
                                    {t("columns.message")}
                                </th>
                                <th className="py-2 font-medium">
                                    {t("columns.submittedAt")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-border/80 align-top last:border-0"
                                >
                                    <td className="py-3 pr-4 text-text-primary">
                                        {row.name}
                                    </td>
                                    <td className="py-3 pr-4 text-text-secondary">
                                        {row.email ?? "—"}
                                    </td>
                                    <td className="py-3 pr-4 text-text-secondary">
                                        {row.phone ?? "—"}
                                    </td>
                                    <td className="py-3 pr-4 text-text-secondary">
                                        {row.attending
                                            ? t("attendingYes")
                                            : t("attendingNo")}
                                    </td>
                                    <td className="py-3 pr-4 text-text-secondary tabular-nums">
                                        {row.guest_count}
                                    </td>
                                    <td className="max-w-[12rem] py-3 pr-4 text-text-secondary">
                                        <span className="line-clamp-3 whitespace-pre-wrap break-words">
                                            {row.dietary ?? "—"}
                                        </span>
                                    </td>
                                    <td className="max-w-[16rem] py-3 pr-4 text-text-secondary">
                                        <span className="line-clamp-3 whitespace-pre-wrap break-words">
                                            {row.message ?? "—"}
                                        </span>
                                    </td>
                                    <td className="py-3 text-text-secondary whitespace-nowrap">
                                        {dateFmt.format(new Date(row.created_at))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
