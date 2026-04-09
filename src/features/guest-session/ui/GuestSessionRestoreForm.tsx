"use client";

import {Link, useRouter} from "@/i18n/navigation";
import React, {useState} from "react";
import {useTranslations} from "next-intl";
import {toast} from "sonner";
import type {GuestSessionPublicErrorCode} from "@features/guest-session";
import {cn} from "@shared/lib/cn";
import {Button} from "@shared/ui/Button";
import {Input} from "@shared/ui/Input";
import {Surface} from "@shared/ui/Surface";

import {useGuestSession} from "./GuestSessionProvider";

export type GuestSessionRestoreFormLayout = "page" | "embedded";

type Props = Readonly<{
    className?: string;
    /** `embedded`: under gallery / wishes; `page`: dedicated sign-in route. */
    layout?: GuestSessionRestoreFormLayout;
    /** Called after successful restore (e.g. `router.refresh` or refetch). */
    onSuccess?: () => void | Promise<void>;
    /** Show link to `/guest/sign-in` (useful when `layout` is `embedded`). */
    showFullPageLink?: boolean;
}>;

function guestRestoreErrorCopy(
    code: GuestSessionPublicErrorCode,
    tErr: ReturnType<typeof useTranslations<"guestSession.errors">>,
    retryAfterSec?: number,
): { title: string; description: string } {
    switch (code) {
        case "rate_limited":
            return {
                title: tErr("rate_limited.title"),
                description: tErr("rate_limited.description", {
                    retryAfterSec: retryAfterSec ?? 60,
                }),
            };
        case "restore_credentials_no_match":
            return {
                title: tErr("restore_credentials_no_match.title"),
                description: tErr("restore_credentials_no_match.description"),
            };
        case "request_failed":
            return {
                title: tErr("request_failed.title"),
                description: tErr("request_failed.description"),
            };
        default:
            return {
                title: tErr("server_error.title"),
                description: tErr("server_error.description"),
            };
    }
}

/**
 * Name + email restore for guest session (`POST /api/guest/session`). Plan §3 / §8.3.
 */
export function GuestSessionRestoreForm({
                                            className,
                                            layout = "embedded",
                                            onSuccess,
                                            showFullPageLink = layout === "embedded",
                                        }: Props) {
    const router = useRouter();
    const t = useTranslations("guestSession.restore");
    const tErr = useTranslations("guestSession.errors");
    const {restoreSession} = useGuestSession();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [fieldHint, setFieldHint] = useState<"name" | "email" | null>(null);
    const [apiError, setApiError] = useState<{
        title: string;
        description: string;
    } | null>(null);

    const headingClass =
        layout === "page"
            ? "font-display text-2xl text-text-primary"
            : "font-display text-h3 text-text-primary";
    const HeadingTag = layout === "page" ? "h1" : "h2";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) {
            return;
        }
        setApiError(null);
        setFieldHint(null);
        setSubmitting(true);

        const result = await restoreSession({name, email});
        setSubmitting(false);

        if (result.ok) {
            toast.success(t("successToast"));
            if (layout === "page") {
                router.refresh();
            }
            await onSuccess?.();
            setName("");
            setEmail("");
            return;
        }

        if (result.kind === "validation") {
            const fe = result.fieldErrors;
            if (fe?.name?.length) {
                setFieldHint("name");
            } else if (fe?.email?.length) {
                setFieldHint("email");
            }
            setApiError({
                title: t("validationSummaryTitle"),
                description: t("validationSummaryDescription"),
            });
            return;
        }

        if (result.kind === "guest_error") {
            setApiError(
                guestRestoreErrorCopy(result.code, tErr, result.retryAfterSec),
            );
        }
    }

    return (
        <Surface
            variant="raised"
            className={cn(
                "flex flex-col gap-5",
                layout === "embedded" && "text-center",
                className,
            )}
        >
            <div>
                <HeadingTag className={headingClass}>{t("title")}</HeadingTag>
                <p
                    className={cn(
                        "mt-2 text-small leading-relaxed text-text-secondary",
                        layout === "embedded" && "mx-auto max-w-md",
                    )}
                >
                    {t("subtitle")}
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className={cn(
                    "flex flex-col gap-4",
                    layout === "embedded" && "text-left",
                )}
            >
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="guest-restore-name"
                        className="text-small font-medium text-text-primary"
                    >
                        {t("nameLabel")}
                    </label>
                    <Input
                        id="guest-restore-name"
                        name="name"
                        autoComplete="name"
                        value={name}
                        onChange={(ev) => {
                            setName(ev.target.value);
                            setFieldHint(null);
                            setApiError(null);
                        }}
                        placeholder={t("namePlaceholder")}
                        required
                        aria-invalid={fieldHint === "name" ? true : undefined}
                    />
                    {fieldHint === "name" ? (
                        <p className="text-small text-red-500" role="alert">
                            {t("nameFieldHint")}
                        </p>
                    ) : null}
                </div>
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="guest-restore-email"
                        className="text-small font-medium text-text-primary"
                    >
                        {t("emailLabel")}
                    </label>
                    <Input
                        id="guest-restore-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(ev) => {
                            setEmail(ev.target.value);
                            setFieldHint(null);
                            setApiError(null);
                        }}
                        placeholder={t("emailPlaceholder")}
                        required
                        aria-invalid={fieldHint === "email" ? true : undefined}
                    />
                    {fieldHint === "email" ? (
                        <p className="text-small text-red-500" role="alert">
                            {t("emailFieldHint")}
                        </p>
                    ) : null}
                </div>

                {apiError ? (
                    <Surface variant="muted" className="p-4" role="alert">
                        <p className="text-small font-medium text-text-primary">
                            {apiError.title}
                        </p>
                        <p className="mt-2 text-small leading-relaxed text-text-secondary">
                            {apiError.description}
                        </p>
                    </Surface>
                ) : null}

                <Button
                    type="submit"
                    disabled={submitting}
                    className={cn(
                        "w-full",
                        layout === "embedded" ? "sm:mx-auto sm:w-auto" : "sm:w-auto",
                    )}
                >
                    {submitting ? t("submitting") : t("submit")}
                </Button>
            </form>

            {showFullPageLink ? (
                <p
                    className={cn(
                        "text-small text-text-secondary",
                        layout === "embedded" && "text-center",
                    )}
                >
                    <Link
                        href="/guest/sign-in"
                        className="text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary"
                    >
                        {t("fullPageLink")}
                    </Link>
                </p>
            ) : null}
        </Surface>
    );
}
