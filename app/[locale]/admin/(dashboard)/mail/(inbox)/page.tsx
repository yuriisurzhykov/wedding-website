import {AdminMailDetailEmpty} from "@widgets/admin-mail";
import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("admin.mail");
    return {
        title: t("metaTitle"),
        robots: {index: false, follow: false},
    };
}

export default function AdminMailInboxPage() {
    return <AdminMailDetailEmpty />;
}
