import {getLocale, getTranslations} from "next-intl/server";

import {Section, SectionHeader, type SectionTheme} from "@shared/ui";
import {formatRsvpDeadlineLine} from '@shared/lib/wedding-calendar'

import {RsvpSectionForm} from "./RsvpSectionForm";

type Props = Readonly<{
    theme?: SectionTheme;
}>;

/**
 * Full RSVP block for the home page: section chrome, localized title/subtitle (with RSVP deadline), and form.
 */
export async function RsvpSection({theme = "base"}: Props = {}) {
    const locale = await getLocale();
    const t = await getTranslations("rsvp");
    const deadline = formatRsvpDeadlineLine(locale);

    return (
        <Section id="rsvp" theme={theme}>
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
