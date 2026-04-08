"use client";

import {useLocale, useTranslations} from "next-intl";
import {toast} from "sonner";

import {DynamicForm} from "@/components/ui/DynamicForm";
import {RSVP_FIELDS} from "@/lib/config/rsvp";

import {RsvpNotificationError, submitRsvpFetch} from "../lib/submit-rsvp-fetch";

/**
 * RSVP form wired to the real API. Kept as a client boundary so {@link DynamicForm} can manage state.
 */
export function RsvpSectionForm() {
    const locale = useLocale();
    const emailLocale = locale === "ru" ? "ru" : "en";
    const t = useTranslations("rsvp");

    return (
        <DynamicForm
            fields={RSVP_FIELDS}
            namespace="rsvp"
            onSubmitAction={async (values) => {
                try {
                    await submitRsvpFetch({
                        ...values,
                        locale: emailLocale,
                    });
                } catch (e) {
                    if (e instanceof RsvpNotificationError) {
                        toast.error(t(`toast.notifyFailed.${e.step}`));
                    } else {
                        toast.error(t("error"));
                    }
                    throw e;
                }
            }}
        />
    );
}
