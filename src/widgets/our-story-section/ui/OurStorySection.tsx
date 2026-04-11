import {getLocale, getTranslations} from "next-intl/server";

import {MdxByLocale, Section, SectionHeader, type SectionTheme} from "@shared/ui";
import {formatStoryWeddingLine} from "@shared/lib/wedding-calendar";

type Props = Readonly<{
    theme?: SectionTheme;
}>;

export async function OurStorySection({theme = "alt"}: Props = {}) {
    const locale = await getLocale();
    const t = await getTranslations("story");
    const weddingDateLabel = formatStoryWeddingLine(locale);

    return (
        <Section id="story" theme={theme}>
            <div
                className="mx-auto max-w-[var(--content-width)] text-center text-text-secondary [&_p]:font-body [&_p]:text-body [&_p]:leading-relaxed [&_p:not(:first-child)]:mt-4 [&_strong]:font-medium [&_strong]:text-text-primary"
                style={{fontFamily: "var(--font-display)"}}
            >
                <SectionHeader title={t("title")} subtitle={t("subtitle")}/>
                <MdxByLocale part="story" locale={locale}/>
                <p>{t("vowsLead", {date: weddingDateLabel})}</p>
            </div>
        </Section>
    );
}
