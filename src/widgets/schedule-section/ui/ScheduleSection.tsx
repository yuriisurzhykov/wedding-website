import {getLocale, getTranslations} from "next-intl/server";

import {Section, SectionHeader, type SectionTheme} from "@shared/ui";
import {type ScheduleItem} from "@shared/lib/wedding-calendar";

import {ScheduleTimeline} from "./ScheduleTimeline";

type Props = Readonly<{
    items: ScheduleItem[];
    theme?: SectionTheme;
}>;

export async function ScheduleSection({items, theme = "alt"}: Props) {
    const locale = await getLocale();
    const t = await getTranslations();

    return (
        <Section id="schedule" theme={theme}>
            <SectionHeader title={t("schedule.title")} subtitle={t("schedule.subtitle")}/>

            <ScheduleTimeline items={items} locale={locale}/>
        </Section>
    );
}
