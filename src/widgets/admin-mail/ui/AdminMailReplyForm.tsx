"use client";

import {useRouter} from "@/i18n/navigation";
import type {InboundEmailRow, ReplyTemplateRow} from "@entities/inbound-email";
import {Button} from "@shared/ui/Button";
import {Input} from "@shared/ui/Input";
import {Select} from "@shared/ui/Select";
import {TextArea} from "@shared/ui/TextArea";
import {useTranslations} from "next-intl";
import {useCallback, useMemo, useState} from "react";
import {toast} from "sonner";

import {buildReplyPreviewDocument} from "../lib/build-reply-preview-document";
import {getAdminMailErrorMessage, postAdminMailReply} from "../lib/fetch-admin-mail-api";

type Props = Readonly<{
    inbound: InboundEmailRow;
    templates: ReplyTemplateRow[];
}>;

export function AdminMailReplyForm({inbound, templates}: Props) {
    const t = useTranslations("admin.mail.reply");
    const router = useRouter();

    const defaultTemplateId = useMemo(() => {
        const d = templates.find((x) => x.is_default);
        return d?.id ?? "";
    }, [templates]);

    const [templateId, setTemplateId] = useState(defaultTemplateId);
    const [subject, setSubject] = useState("");
    const [heading, setHeading] = useState("");
    const [bodyHtml, setBodyHtml] = useState("");
    const [sending, setSending] = useState(false);

    const selectedTemplate = useMemo(() => {
        if (!templateId) {
            return null;
        }
        return templates.find((x) => x.id === templateId) ?? null;
    }, [templateId, templates]);

    const previewDoc = useMemo(() => {
        try {
            return buildReplyPreviewDocument({
                inbound,
                template: selectedTemplate,
                subjectNoTemplate: subject,
                heading,
                body_html: bodyHtml,
            });
        } catch {
            return "";
        }
    }, [inbound, selectedTemplate, subject, heading, bodyHtml]);

    const send = useCallback(async () => {
        if (!selectedTemplate && !subject.trim()) {
            toast.error(t("toast.subjectRequired"));
            return;
        }
        if (!heading.trim()) {
            toast.error(t("toast.headingRequired"));
            return;
        }
        if (!bodyHtml.trim()) {
            toast.error(t("toast.bodyRequired"));
            return;
        }

        setSending(true);
        try {
            const payload = {
                template_id: selectedTemplate ? selectedTemplate.id : null,
                subject: selectedTemplate ? undefined : subject.trim(),
                heading: heading.trim(),
                body_html: bodyHtml,
            };
            const res = await postAdminMailReply(inbound.id, payload);
            if (!res.ok) {
                toast.error(
                    getAdminMailErrorMessage(res.data, t("toast.sendFailed")),
                );
                return;
            }
            toast.success(t("toast.sent"));
            router.refresh();
        } finally {
            setSending(false);
        }
    }, [bodyHtml, heading, inbound.id, router, selectedTemplate, subject, t]);

    return (
        <div className="rounded-lg border border-border bg-bg-section/40 p-4">
            <h3 className="font-display text-h3 text-text-primary">{t("title")}</h3>
            <p className="mt-1 text-small text-text-secondary">{t("hint")}</p>

            <div className="mt-4 space-y-4">
                <div>
                    <label className="mb-1 block text-small font-medium text-text-primary" htmlFor="reply-template">
                        {t("templateLabel")}
                    </label>
                    <Select
                        id="reply-template"
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                    >
                        <option value="">{t("templateNone")}</option>
                        {templates.map((tpl) => (
                            <option key={tpl.id} value={tpl.id}>
                                {tpl.name}
                                {tpl.is_default ? ` (${t("templateDefaultBadge")})` : ""}
                            </option>
                        ))}
                    </Select>
                </div>

                {!selectedTemplate ? (
                    <div>
                        <label className="mb-1 block text-small font-medium text-text-primary" htmlFor="reply-subject">
                            {t("subjectLabel")}
                        </label>
                        <Input
                            id="reply-subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            autoComplete="off"
                        />
                    </div>
                ) : null}

                <div>
                    <label className="mb-1 block text-small font-medium text-text-primary" htmlFor="reply-heading">
                        {t("headingLabel")}
                    </label>
                    <Input
                        id="reply-heading"
                        value={heading}
                        onChange={(e) => setHeading(e.target.value)}
                        autoComplete="off"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-small font-medium text-text-primary" htmlFor="reply-body">
                        {t("bodyLabel")}
                    </label>
                    <TextArea
                        id="reply-body"
                        rows={8}
                        value={bodyHtml}
                        onChange={(e) => setBodyHtml(e.target.value)}
                        className="resize-y font-mono text-small"
                    />
                </div>

                <div>
                    <p className="mb-2 text-small font-medium text-text-primary">{t("previewLabel")}</p>
                    <iframe
                        title={t("previewTitle")}
                        className="h-[min(50vh,420px)] w-full rounded-md border border-border bg-bg-card"
                        sandbox=""
                        srcDoc={previewDoc}
                    />
                </div>

                <Button type="button" disabled={sending} onClick={() => void send()}>
                    {sending ? t("sending") : t("send")}
                </Button>
            </div>
        </div>
    );
}
