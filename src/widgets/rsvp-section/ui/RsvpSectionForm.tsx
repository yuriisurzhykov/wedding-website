"use client";

import {useLocale} from "next-intl";

import {DynamicForm} from "@/components/ui/DynamicForm";
import {RSVP_FIELDS} from "@/lib/config/rsvp";

import {submitRsvpFetch} from "../lib/submit-rsvp-fetch";

/**
 * RSVP form wired to the real API. Kept as a client boundary so {@link DynamicForm} can manage state.
 */
export function RsvpSectionForm() {
    const locale = useLocale();
    const emailLocale = locale === "ru" ? "ru" : "en";

    return (
        <DynamicForm
            fields={RSVP_FIELDS}
            namespace="rsvp"
            onSubmitAction={(values) =>
                submitRsvpFetch({...values, locale: emailLocale})
            }
        />
    );
}
