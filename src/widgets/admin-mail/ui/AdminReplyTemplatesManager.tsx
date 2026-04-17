"use client";

import type {ReplyTemplateRow} from "@entities/inbound-email";
import {Button} from "@shared/ui/Button";
import {Input} from "@shared/ui/Input";
import {Select} from "@shared/ui/Select";
import {TextArea} from "@shared/ui/TextArea";
import {useTranslations} from "next-intl";
import {useCallback, useState} from "react";
import {toast} from "sonner";

import {
    deleteAdminReplyTemplate,
    getAdminMailErrorMessage,
    patchAdminReplyTemplate,
    postAdminReplyTemplate,
} from "../lib/fetch-admin-mail-api";

type Props = Readonly<{
    initialTemplates: ReplyTemplateRow[];
}>;

export function AdminReplyTemplatesManager({initialTemplates}: Props) {
    const t = useTranslations("admin.mail.templates");
    const [rows, setRows] = useState(initialTemplates);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [heading, setHeading] = useState("");
    const [bodyHtml, setBodyHtml] = useState("");
    const [bodyText, setBodyText] = useState("");
    const [isDefault, setIsDefault] = useState(false);
    const [saving, setSaving] = useState(false);

    const resetCreate = useCallback(() => {
        setName("");
        setSubject("");
        setHeading("");
        setBodyHtml("");
        setBodyText("");
        setIsDefault(false);
        setEditingId(null);
    }, []);

    const startEdit = useCallback((row: ReplyTemplateRow) => {
        setEditingId(row.id);
        setName(row.name);
        setSubject(row.subject);
        setHeading(row.heading);
        setBodyHtml(row.body_html);
        setBodyText(row.body_text);
        setIsDefault(row.is_default);
    }, []);

    const save = useCallback(async () => {
        if (!name.trim() || !subject.trim() || !heading.trim() || !bodyHtml.trim()) {
            toast.error(t("toast.validation"));
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                const res = await patchAdminReplyTemplate(editingId, {
                    name: name.trim(),
                    subject: subject.trim(),
                    heading: heading.trim(),
                    body_html: bodyHtml,
                    body_text: bodyText.trim() || null,
                    is_default: isDefault,
                });
                if (!res.ok) {
                    toast.error(getAdminMailErrorMessage(res.data, t("toast.saveFailed")));
                    return;
                }
                setRows((prev) =>
                    prev.map((r) => (r.id === editingId ? res.data.template : r)),
                );
                toast.success(t("toast.updated"));
            } else {
                const res = await postAdminReplyTemplate({
                    name: name.trim(),
                    subject: subject.trim(),
                    heading: heading.trim(),
                    body_html: bodyHtml,
                    body_text: bodyText.trim() || null,
                    is_default: isDefault,
                });
                if (!res.ok) {
                    toast.error(getAdminMailErrorMessage(res.data, t("toast.saveFailed")));
                    return;
                }
                setRows((prev) => [res.data.template, ...prev]);
                toast.success(t("toast.created"));
            }
            resetCreate();
        } finally {
            setSaving(false);
        }
    }, [bodyHtml, bodyText, editingId, heading, isDefault, name, resetCreate, subject, t]);

    const remove = useCallback(
        async (id: string) => {
            if (!window.confirm(t("confirmDelete"))) {
                return;
            }
            const res = await deleteAdminReplyTemplate(id);
            if (!res.ok) {
                toast.error(getAdminMailErrorMessage(res.data, t("toast.deleteFailed")));
                return;
            }
            setRows((prev) => prev.filter((r) => r.id !== id));
            if (editingId === id) {
                resetCreate();
            }
            toast.success(t("toast.deleted"));
        },
        [editingId, resetCreate, t],
    );

    return (
        <div className="space-y-8">
            <div className="rounded-lg border border-border bg-bg-section/40 p-4">
                <h2 className="font-display text-h3 text-text-primary">
                    {editingId ? t("form.editTitle") : t("form.createTitle")}
                </h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-small font-medium text-text-primary" htmlFor="tpl-name">
                            {t("form.name")}
                        </label>
                        <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-small font-medium text-text-primary" htmlFor="tpl-subject">
                            {t("form.subject")}
                        </label>
                        <Input id="tpl-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-small font-medium text-text-primary" htmlFor="tpl-heading">
                            {t("form.heading")}
                        </label>
                        <Input id="tpl-heading" value={heading} onChange={(e) => setHeading(e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-small font-medium text-text-primary" htmlFor="tpl-body-html">
                            {t("form.bodyHtml")}
                        </label>
                        <TextArea
                            id="tpl-body-html"
                            rows={6}
                            value={bodyHtml}
                            onChange={(e) => setBodyHtml(e.target.value)}
                            className="resize-y font-mono text-small"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-small font-medium text-text-primary" htmlFor="tpl-body-text">
                            {t("form.bodyText")}
                        </label>
                        <TextArea
                            id="tpl-body-text"
                            rows={3}
                            value={bodyText}
                            onChange={(e) => setBodyText(e.target.value)}
                            className="resize-y text-small"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-small font-medium text-text-primary" htmlFor="tpl-default">
                            {t("form.default")}
                        </label>
                        <Select
                            id="tpl-default"
                            value={isDefault ? "yes" : "no"}
                            onChange={(e) => setIsDefault(e.target.value === "yes")}
                        >
                            <option value="no">{t("form.defaultNo")}</option>
                            <option value="yes">{t("form.defaultYes")}</option>
                        </Select>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" disabled={saving} onClick={() => void save()}>
                        {saving ? t("form.saving") : editingId ? t("form.save") : t("form.create")}
                    </Button>
                    {editingId ? (
                        <Button type="button" variant="ghost" disabled={saving} onClick={resetCreate}>
                            {t("form.cancelEdit")}
                        </Button>
                    ) : null}
                </div>
            </div>

            <div>
                <h2 className="font-display text-h3 text-text-primary">{t("tableTitle")}</h2>
                {rows.length === 0 ? (
                    <p className="mt-4 text-body text-text-secondary">{t("empty")}</p>
                ) : (
                    <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-bg-card">
                        {rows.map((row) => (
                            <li
                                key={row.id}
                                className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-text-primary">{row.name}</p>
                                    <p className="text-small text-text-secondary">{row.subject}</p>
                                    {row.is_default ? (
                                        <span className="mt-1 inline-block rounded-md bg-bg-section px-2 py-0.5 text-caption text-text-secondary">
                                            {t("defaultBadge")}
                                        </span>
                                    ) : null}
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(row)}>
                                        {t("edit")}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void remove(row.id)}
                                    >
                                        {t("delete")}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
