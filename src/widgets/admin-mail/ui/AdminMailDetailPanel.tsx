"use client";

import {useRouter} from "@/i18n/navigation";
import type {InboundEmailAttachmentRow, InboundEmailRow, ReplyTemplateRow} from "@entities/inbound-email";
import {Button} from "@shared/ui/Button";
import {useFormatter} from "next-intl";
import {useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";

import {
    deleteAdminMail,
    getAdminMailErrorMessage,
    patchAdminMailStatus,
} from "../lib/fetch-admin-mail-api";
import {AdminInboundHtmlPreview} from "./AdminInboundHtmlPreview";
import {AdminMailReplyForm} from "./AdminMailReplyForm";

type Props = Readonly<{
    email: InboundEmailRow;
    attachments: InboundEmailAttachmentRow[];
    templates: ReplyTemplateRow[];
}>;

export function AdminMailDetailPanel({email, attachments, templates}: Props) {
    const t = useTranslations("admin.mail.detail");
    const router = useRouter();
    const format = useFormatter();
    const markedReadRef = useRef(false);

    const [status, setStatus] = useState(email.status);
    const [working, setWorking] = useState<"archive" | "delete" | "unread" | null>(null);

    useEffect(() => {
        setStatus(email.status);
    }, [email.status, email.id]);

    useEffect(() => {
        if (email.status !== "unread" || markedReadRef.current) {
            return;
        }
        markedReadRef.current = true;
        void (async () => {
            const res = await patchAdminMailStatus(email.id, "read");
            if (res.ok) {
                setStatus("read");
                router.refresh();
            }
        })();
    }, [email.id, email.status, router]);

    const receivedLabel = format.dateTime(new Date(email.received_at), {
        dateStyle: "medium",
        timeStyle: "short",
    });

    async function onArchive() {
        setWorking("archive");
        try {
            const res = await patchAdminMailStatus(email.id, "archived");
            if (!res.ok) {
                toast.error(getAdminMailErrorMessage(res.data, t("toast.statusFailed")));
                return;
            }
            setStatus("archived");
            toast.success(t("toast.archived"));
            router.refresh();
        } finally {
            setWorking(null);
        }
    }

    async function onMarkUnread() {
        setWorking("unread");
        try {
            const res = await patchAdminMailStatus(email.id, "unread");
            if (!res.ok) {
                toast.error(getAdminMailErrorMessage(res.data, t("toast.statusFailed")));
                return;
            }
            setStatus("unread");
            toast.success(t("toast.markedUnread"));
            router.refresh();
        } finally {
            setWorking(null);
        }
    }

    async function onDelete() {
        if (!window.confirm(t("confirmDelete"))) {
            return;
        }
        setWorking("delete");
        try {
            const res = await deleteAdminMail(email.id);
            if (!res.ok) {
                toast.error(getAdminMailErrorMessage(res.data, t("toast.deleteFailed")));
                return;
            }
            toast.success(t("toast.deleted"));
            router.push("/admin/mail");
            router.refresh();
        } finally {
            setWorking(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="font-display text-h2 text-text-primary">
                            {email.subject?.trim() || t("noSubject")}
                        </h1>
                        <p className="mt-2 text-body text-text-secondary">
                            <span className="text-text-primary">{t("fromLabel")}</span> {email.from_address}
                        </p>
                        {email.from_name?.trim() ? (
                            <p className="mt-1 text-small text-text-muted">
                                {t("senderNameLabel")} {email.from_name.trim()}
                            </p>
                        ) : null}
                        <p className="mt-1 text-small text-text-muted">
                            <span className="text-text-secondary">{t("toLabel")}</span> {email.to_address}
                        </p>
                        <p className="mt-1 text-small text-text-muted">
                            <span className="text-text-secondary">{t("receivedLabel")}</span> {receivedLabel}
                        </p>
                        {status === "archived" ? (
                            <p className="mt-2 inline-block rounded-md bg-bg-section px-2 py-1 text-caption text-text-secondary">
                                {t("badgeArchived")}
                            </p>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={working !== null || status === "archived"}
                            onClick={() => void onArchive()}
                        >
                            {working === "archive" ? t("archiving") : t("archive")}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={working !== null || status === "unread"}
                            onClick={() => void onMarkUnread()}
                        >
                            {working === "unread" ? t("markingUnread") : t("markUnread")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={working !== null}
                            onClick={() => void onDelete()}
                        >
                            {working === "delete" ? t("deleting") : t("delete")}
                        </Button>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="mb-2 font-display text-h3 text-text-primary">{t("messageHeading")}</h2>
                    <AdminInboundHtmlPreview
                        html={email.html}
                        textFallback={email.text}
                        title={t("iframeTitle")}
                    />
                </div>

                {attachments.length > 0 ? (
                    <div className="mt-8">
                        <h2 className="mb-2 font-display text-h3 text-text-primary">{t("attachmentsHeading")}</h2>
                        <ul className="space-y-2">
                            {attachments.map((a) => (
                                <li key={a.id} className="text-body">
                                    {a.r2_public_url ? (
                                        <a
                                            href={a.r2_public_url}
                                            className="text-primary underline underline-offset-2"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {a.filename}
                                        </a>
                                    ) : (
                                        <span className="text-text-secondary">{a.filename}</span>
                                    )}
                                    {a.size_bytes != null ? (
                                        <span className="ml-2 text-small text-text-muted">
                                            ({Math.ceil(a.size_bytes / 1024)} KB)
                                        </span>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </div>

            <AdminMailReplyForm inbound={email} templates={templates} />
        </div>
    );
}
