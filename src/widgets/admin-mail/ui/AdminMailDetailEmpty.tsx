import {getTranslations} from "next-intl/server";

export async function AdminMailDetailEmpty() {
    const t = await getTranslations("admin.mail");

    return (
        <div
            className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-bg-section/40 p-8 text-center"
        >
            <p className="text-body text-text-secondary">{t("detail.selectMessage")}</p>
        </div>
    );
}
