"use client";

import {useRouter} from "@/i18n/navigation";
import {Button} from "@shared/ui/Button";
import {useTranslations} from "next-intl";
import {useState} from "react";
import {toast} from "sonner";

import {getAdminMailErrorMessage, postAdminMailWebhookSync} from "../lib/fetch-admin-mail-api";

export function AdminMailSyncWebhookButton() {
    const t = useTranslations("admin.mail.webhook");
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    return (
        <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => {
                void (async () => {
                    setBusy(true);
                    try {
                        const res = await postAdminMailWebhookSync();
                        if (!res.ok) {
                            toast.error(getAdminMailErrorMessage(res.data, t("toastFailed")));
                            return;
                        }
                        toast.success(t("toastOk"));
                        router.refresh();
                    } finally {
                        setBusy(false);
                    }
                })();
            }}
        >
            {busy ? t("syncing") : t("syncNow")}
        </Button>
    );
}
