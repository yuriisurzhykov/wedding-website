import {parseAdminRsvpsQuery} from "@features/admin-rsvp-list";
import {AdminGuestsSection} from "@widgets/admin-guests";
import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

type Props = Readonly<{
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("admin.guests");
    return {
        title: t("metaTitle"),
        robots: {index: false, follow: false},
    };
}

export default async function AdminGuestsPage({searchParams}: Props) {
    const sp = await searchParams;
    const parsed = parseAdminRsvpsQuery(sp);
    if (!parsed.ok) {
        const t = await getTranslations("admin.guests");
        return (
            <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
                <h1 className="font-display text-h2 text-text-primary">
                    {t("title")}
                </h1>
                <p className="mt-4 text-body text-red-500" role="alert">
                    {t("invalidQuery")}
                </p>
            </section>
        );
    }

    let filter: "all" | "attending" | "notAttending" = "all";
    if (parsed.attending === true) {
        filter = "attending";
    } else if (parsed.attending === false) {
        filter = "notAttending";
    }

    return <AdminGuestsSection filter={filter} />;
}
