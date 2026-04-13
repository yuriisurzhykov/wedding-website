import {getLocale, getTranslations} from "next-intl/server";

import {Section, SectionHeader, type SectionTheme} from "@shared/ui";
import {type ScheduleItem} from "@shared/lib/wedding-calendar";

import {ScheduleTimeline} from "./ScheduleTimeline";

type Props = Readonly<{
    items: ScheduleItem[];
    theme?: SectionTheme;
    /** When provided, overrides default `messages` for the section header and emphasis badge source. */
    headerTitle?: string | null;
    headerSubtitle?: string | null;
    emphasisBadgeText?: string | null;
}>;

export async function ScheduleSection({
    items,
    theme = "alt",
    headerTitle,
    headerSubtitle,
    emphasisBadgeText,
}: Props) {
    const locale = await getLocale();
    const t = await getTranslations();

    const title =
        headerTitle != null && headerTitle.trim() !== "" ? headerTitle : t("schedule.title");
    const subtitle =
        headerSubtitle != null && headerSubtitle.trim() !== ""
            ? headerSubtitle
            : t("schedule.subtitle");
    const emphasisBadgeLabel =
        emphasisBadgeText != null && emphasisBadgeText.trim() !== ""
            ? emphasisBadgeText
            : t("schedule.emphasisBadge");

    return (
        <Section id="schedule" theme={theme}>
            <SectionHeader title={title} subtitle={subtitle}/>

            <ScheduleTimeline
                items={items}
                locale={locale}
                emphasisBadgeLabel={emphasisBadgeLabel}
            />
        </Section>
    );
}
