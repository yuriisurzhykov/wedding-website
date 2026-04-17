import {AdminMailDetailSection} from "@widgets/admin-mail";
import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

type Props = Readonly<{
    params: Promise<{id: string}>;
}>;

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("admin.mail");
    return {
        title: t("metaTitleDetail"),
        robots: {index: false, follow: false},
    };
}

export default async function AdminMailDetailPage({params}: Props) {
    const {id} = await params;
    return <AdminMailDetailSection id={id} />;
}
