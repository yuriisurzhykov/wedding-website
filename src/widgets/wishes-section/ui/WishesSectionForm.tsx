'use client'

import {Link, useRouter} from '@/i18n/navigation'
import {useEffect, useRef, useState} from "react";
import {useTranslations} from "next-intl";
import {toast} from "sonner";

import {GuestSessionRestoreForm, useGuestSession} from "@features/guest-session";
import {GALLERY_MAX_FILE_BYTES, GALLERY_MAX_SOURCE_FILE_BYTES,} from "@entities/photo";
import {cn} from "@shared/lib/cn";
import {GalleryPhotoPrepareError} from "@shared/lib/prepare-gallery-photo-for-upload";
import {useCelebrationLive} from "@shared/lib/wedding-calendar/use-celebration-live";
import {isGalleryUploadOversizeMessage} from "@shared/lib/validate-gallery-photo-file";
import {Button} from "@shared/ui/Button";
import {Input} from "@shared/ui/Input";
import {PhotoFileInput} from "@shared/ui";
import {TextArea} from "@shared/ui/TextArea";

import {uploadWishAttachment} from "../lib/upload-wish-attachment";
import type {WishesPresentation} from "../lib/wishes-presentation";

const MAX_MB = Math.floor(GALLERY_MAX_FILE_BYTES / (1024 * 1024));
const SOURCE_MAX_MB = Math.floor(
    GALLERY_MAX_SOURCE_FILE_BYTES / (1024 * 1024),
);

export function WishesSectionForm({
                                      presentation = "preview",
                                      className,
                                  }: {
    presentation?: WishesPresentation;
    className?: string;
}) {
    const t = useTranslations("wishes");
    const tu = useTranslations("upload");
    const tGuestErr = useTranslations("guestSession.errors");
    const router = useRouter();
    const {status: guestStatus, session} = useGuestSession();
    const isCelebrationLive = useCelebrationLive();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const needsNameField = guestStatus === "anonymous";
    const showNameSkeleton = guestStatus === "loading";
    const showRestoreForm =
        guestStatus === "anonymous" && presentation === "full";
    const showHomeAnonymousHint =
        guestStatus === "anonymous" && presentation === "preview";
    const photoBlockedByCelebration =
        guestStatus === "authenticated" &&
        session !== null &&
        session.attending === true &&
        !isCelebrationLive;

    const photoPickerDisabled =
        guestStatus === "loading" ||
        guestStatus === "anonymous" ||
        photoBlockedByCelebration;

    useEffect(() => {
        if (photoPickerDisabled) {
            setPhoto(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [photoPickerDisabled]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting || guestStatus === "loading") {
            return;
        }
        if (needsNameField && !name.trim()) {
            return;
        }
        if (!message.trim()) {
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const uploaderLabel =
                guestStatus === "authenticated" && session
                    ? session.displayName
                    : name.trim();

            let photoR2Key: string | undefined;
            if (photo && guestStatus === "authenticated") {
                photoR2Key = await uploadWishAttachment(
                    photo,
                    uploaderLabel,
                    () => {
                    },
                );
            }

            const payload: Record<string, unknown> = {
                message: message.trim(),
            };
            if (photoR2Key) {
                payload.photoR2Key = photoR2Key;
            }
            if (needsNameField) {
                payload.authorName = name.trim();
            }

            const res = await fetch("/api/wishes", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                credentials: "same-origin",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let fieldAuthor: string[] | undefined;
                let celebrationCode: string | undefined;
                try {
                    const data = (await res.json()) as {
                        fieldErrors?: { authorName?: string[] };
                        error?: { code?: string };
                    };
                    fieldAuthor = data.fieldErrors?.authorName;
                    celebrationCode = data.error?.code;
                } catch {
                    /* ignore */
                }
                if (celebrationCode === "celebration_not_live") {
                    setError(tGuestErr("celebration_not_live.title"));
                } else if (fieldAuthor?.length) {
                    setError(t("nameRequired"));
                } else {
                    setError(t("error"));
                }
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
        } catch (err) {
            console.error("[WishesSectionForm]", err);
            if (err instanceof GalleryPhotoPrepareError) {
                if (err.kind === "source_too_large") {
                    toast.error(
                        tu("photoSourceTooLarge", {maxMb: SOURCE_MAX_MB}),
                    );
                } else if (err.kind === "output_too_large") {
                    toast.error(tu("photoStillTooLarge", {maxMb: MAX_MB}));
                } else {
                    toast.error(tu("photoOptimizeFailed"));
                }
                setError(null);
                setSubmitting(false);
                return;
            }
            const raw =
                err instanceof Error && err.message.trim()
                    ? err.message
                    : t("error");
            if (isGalleryUploadOversizeMessage(raw)) {
                toast.error(tu("photoTooLarge", {maxMb: MAX_MB}));
                setError(null);
            } else {
                setError(raw);
            }
            setSubmitting(false);
        }
    }

    return (
        <div
            className={cn(
                "mx-auto mt-10 flex w-full max-w-xl flex-col gap-6",
                className,
            )}
        >
            {showRestoreForm ? (
                <GuestSessionRestoreForm
                    className="w-full"
                    onSuccess={() => router.refresh()}
                />
            ) : null}
            {showHomeAnonymousHint ? (
                <p className="mx-auto max-w-[min(36rem,var(--content-width))] text-center font-display text-h3 font-medium leading-relaxed text-text-secondary">
                    {t.rich("anonymousSessionHintHome", {
                        rsvp: (chunks) => (
                            <Link
                                href={{pathname: "/", hash: "rsvp"}}
                                className="text-primary underline decoration-primary/50 underline-offset-[0.2em] transition hover:decoration-primary"
                            >
                                {chunks}
                            </Link>
                        ),
                    })}
                </p>
            ) : null}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {showNameSkeleton ? (
                    <div className="flex flex-col gap-2" aria-hidden>
                        <div className="h-4 w-28 max-w-[40%] animate-pulse rounded bg-bg-section"/>
                        <div className="h-10 w-full animate-pulse rounded-xl bg-bg-section"/>
                    </div>
                ) : needsNameField ? (
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
                ) : session ? (
                    <p className="text-small text-text-secondary">
                        {t("signedInAs", {name: session.displayName})}
                    </p>
                ) : null}
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
                        disabled={showNameSkeleton}
                    />
                </div>
                <div
                    className={cn(
                        "flex flex-col gap-2",
                        showNameSkeleton && "pointer-events-none opacity-60",
                    )}
                >
                    <label htmlFor="wish-photo" className="text-small font-medium text-text-primary">
                        {t("photoLabel")}
                    </label>
                    {photoBlockedByCelebration ? (
                        <p className="text-small text-text-muted" id="wish-photo-hint">
                            {t("photoLockedUntilCelebration")}
                        </p>
                    ) : photoPickerDisabled && guestStatus === "anonymous" ? (
                        <p className="text-small text-text-muted" id="wish-photo-hint">
                            {t("photoGuestSignInHint")}
                        </p>
                    ) : null}
                    <PhotoFileInput
                        ref={fileInputRef}
                        id="wish-photo"
                        showHint
                        disabled={photoPickerDisabled}
                        aria-describedby={
                            (photoBlockedByCelebration ||
                                (photoPickerDisabled && guestStatus === "anonymous"))
                                ? "wish-photo-hint"
                                : undefined
                        }
                        onFileChange={setPhoto}
                        className="text-small text-text-secondary file:mr-3 file:rounded-pill file:border-0 file:bg-bg-section file:px-4 file:py-2 file:text-body file:text-text-primary"
                    />
                </div>
                {error ? (
                    <p className="text-small text-red-500" role="alert">
                        {error}
                    </p>
                ) : null}
                <Button type="submit" disabled={submitting || showNameSkeleton}>
                    {submitting ? t("submitting") : t("submit")}
                </Button>
            </form>
        </div>
    );
}
