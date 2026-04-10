import {getLocale, getTranslations} from "next-intl/server";

import {MdxByLocale, Section, SectionHeader, type SectionTheme} from "@shared/ui";

type Props = Readonly<{
    theme?: SectionTheme;
}>;

export async function WelcomeSection({theme = "base"}: Props = {}) {
    const locale = await getLocale();
    const t = await getTranslations("welcome");

    return (
        <Section id="welcome" theme={theme}>
            <div
                className="mx-auto max-w-[var(--content-width)] text-center text-text-secondary [&_p]:font-body [&_p]:text-body [&_p]:leading-relaxed [&_p:not(:first-child)]:mt-4 [&_strong]:font-medium [&_strong]:text-text-primary"
                style={{fontFamily: "var(--font-display)"}}
            >
                <SectionHeader title={t("title")}/>
                <MdxByLocale part="welcome" locale={locale}/>
            </div>
        </Section>
    );
}
