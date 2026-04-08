import {getLocale, getTranslations} from "next-intl/server";

import {Section} from "@/components/ui/Section";
import {SectionHeader} from "@/components/ui/SectionHeader";
import {formatRsvpDeadlineLine} from "@/lib/wedding-calendar";

import {RsvpSectionForm} from "./RsvpSectionForm";

/**
 * Full RSVP block for the home page: section chrome, localized title/subtitle (with RSVP deadline), and form.
 */
export async function RsvpSection() {
    const locale = await getLocale();
    const t = await getTranslations("rsvp");
    const deadline = formatRsvpDeadlineLine(locale);

    return (
        <Section id="rsvp" theme="base">
            <div className="mx-auto max-w-[var(--content-width)]">
                <SectionHeader
                    title={t("title")}
                    subtitle={t("subtitle", {deadline})}
                />
                <RsvpSectionForm/>
            </div>
        </Section>
    );
}
