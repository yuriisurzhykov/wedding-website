import { getLocale, getTranslations } from "next-intl/server";

import { MdxByLocale } from "@/components/content/MdxByLocale";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatStoryWeddingLine } from "@/lib/wedding-calendar";

export async function OurStory() {
  const locale = await getLocale();
  const t = await getTranslations("story");
  const weddingDateLabel = formatStoryWeddingLine(locale);

  return (
    <Section id="story" theme="alt">
      <div
        className="mx-auto max-w-[var(--content-width)] text-center text-text-secondary [&_p]:font-body [&_p]:text-body [&_p]:leading-relaxed [&_p:not(:first-child)]:mt-4 [&_strong]:font-medium [&_strong]:text-text-primary"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <SectionHeader title={t("title")} />
        <MdxByLocale part="story" locale={locale} />
        <p>{t("vowsLead", { date: weddingDateLabel })}</p>
      </div>
    </Section>
  );
}
