"use client";

import {useGuestSession} from "@features/guest-session";
import {useLocale, useTranslations} from "next-intl";
import {toast} from "sonner";

import {RSVP_FIELDS} from "@entities/rsvp";
import {DynamicForm} from "@shared/ui";

import {RsvpApiError, RsvpNotificationError, submitRsvpFetch} from "../lib/submit-rsvp-fetch";
import {RsvpCompanionNamesSlot} from "./RsvpCompanionNamesSlot";

/**
 * RSVP form wired to the real API. Kept as a client boundary so {@link DynamicForm} can manage state.
 */
export function RsvpSectionForm() {
    const locale = useLocale();
    const emailLocale = locale === "ru" ? "ru" : "en";
    const t = useTranslations("rsvp");
    const tApi = useTranslations("apiErrors");
    const {applyFromApiBody} = useGuestSession();

    return (
        <DynamicForm
            fields={RSVP_FIELDS}
            namespace="rsvp"
            slotAfterField={{
                guestCount: (slotCtx) => <RsvpCompanionNamesSlot ctx={slotCtx} />,
            }}
            onSubmitAction={async (values) => {
                try {
                    await submitRsvpFetch(
                        {
                            ...values,
                            locale: emailLocale,
                        },
                        {onGuestSessionFromResponse: applyFromApiBody},
                    );
                } catch (e) {
                    if (e instanceof RsvpNotificationError) {
                        toast.error(t(`toast.notifyFailed.${e.step}`));
                    } else if (e instanceof RsvpApiError) {
                        if (e.errorCode === "too_many_requests") toast.error(tApi("tooManyRequests"));
                        else if (e.errorCode === "payload_too_large") toast.error(tApi("payloadTooLarge"));
                        else if (e.errorCode === "feature_disabled") toast.error(tApi("featureDisabled"));
                        else toast.error(t("error"));
                    } else {
                        toast.error(t("error"));
                    }
                    throw e;
                }
            }}
        />
    );
}
