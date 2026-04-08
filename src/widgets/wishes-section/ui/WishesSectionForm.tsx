'use client'

import {useRouter} from "next/navigation";
import {useRef, useState} from "react";
import {useTranslations} from "next-intl";
import {toast} from "sonner";

import {Button} from "@shared/ui/Button";
import {Input} from "@shared/ui/Input";
import {TextArea} from "@shared/ui/TextArea";

import {uploadWishAttachment} from "../lib/upload-wish-attachment";

export function WishesSectionForm() {
    const t = useTranslations("wishes");
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !message.trim() || submitting) {
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            let photoR2Key: string | undefined;
            if (photo) {
                photoR2Key = await uploadWishAttachment(
                    photo,
                    name.trim(),
                    () => {},
                );
            }

            const res = await fetch("/api/wishes", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    authorName: name.trim(),
                    message: message.trim(),
                    photoR2Key,
                }),
            });

            if (!res.ok) {
                setError(t("error"));
                setSubmitting(false);
                return;
            }

            setName("");
            setMessage("");
            setPhoto(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            toast.success(t("success"));
            router.refresh();
            setSubmitting(false);
        } catch {
            setError(t("error"));
            setSubmitting(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 flex w-full max-w-xl flex-col gap-4"
        >
            <div className="flex flex-col gap-2">
                <label htmlFor="wish-name" className="text-small font-medium text-text-primary">
                    {t("nameLabel")}
                </label>
                <Input
                    id="wish-name"
                    name="authorName"
                    placeholder={t("namePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                />
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="wish-message" className="text-small font-medium text-text-primary">
                    {t("messageLabel")}
                </label>
                <TextArea
                    id="wish-message"
                    name="message"
                    placeholder={t("messagePlaceholder")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                />
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="wish-photo" className="text-small font-medium text-text-primary">
                    {t("photoLabel")}
                </label>
                <input
                    ref={fileInputRef}
                    id="wish-photo"
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                    className="text-small text-text-secondary file:mr-3 file:rounded-pill file:border-0 file:bg-bg-section file:px-4 file:py-2 file:text-body file:text-text-primary"
                    onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setPhoto(f);
                    }}
                />
            </div>
            {error ? (
                <p className="text-small text-red-500" role="alert">
                    {error}
                </p>
            ) : null}
            <Button type="submit" disabled={submitting}>
                {submitting ? t("submitting") : t("submit")}
            </Button>
        </form>
    );
}
