import {getLocale, getTranslations} from "next-intl/server";

import {Section, SectionHeader, type SectionTheme} from "@shared/ui";
import {getScheduleIcon} from "@shared/ui/icons/schedule";
import {type ScheduleItem, formatScheduleClock} from "@shared/lib/wedding-calendar";

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

            <div className="relative mx-auto max-w-2xl">
                <div className="absolute top-0 bottom-0 left-8 w-px bg-border" aria-hidden/>

                <div className="flex flex-col gap-8">
                    {items.map((item) => {
                        const Icon = getScheduleIcon(item.iconId);
                        return (
                            <div key={item.id} className="flex items-start gap-6">
                                <div
                                    className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-pill border-2 border-border bg-bg-card text-primary shadow-sm"
                                    aria-hidden
                                >
                                    <Icon className="h-8 w-8"/>
                                </div>

                                <div className="flex-1 pt-2 pb-6">
                                    <div className="mb-1 flex items-baseline gap-3">
                                        <span className="font-mono text-small font-medium text-primary">
                                            {formatScheduleClock(locale, item.hour, item.minute)}
                                        </span>
                                        <h3 className="font-display text-h3 text-text-primary">
                                            {t(item.titleKey)}
                                        </h3>
                                    </div>
                                    <p className="text-body text-text-secondary">{t(item.descKey)}</p>
                                    {item.location && item.locationUrl ? (
                                        <a
                                            href={item.locationUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-flex items-center gap-1 text-small text-primary transition-colors hover:text-primary-dark"
                                        >
                                            <span aria-hidden>📍</span>
                                            {item.location}
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Section>
    );
}
