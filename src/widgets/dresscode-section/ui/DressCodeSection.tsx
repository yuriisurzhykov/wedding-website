"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";

import {Section, SectionHeader, type SectionTheme} from "@shared/ui";
import {cn} from "@shared/lib/cn";
import {PALETTE} from "@entities/dresscode";

type Props = Readonly<{
    theme?: SectionTheme;
}>;

const DEFAULT_PALETTE_CLASS_NAME = "mb-10 grid grid-cols-4 justify-items-center gap-4"

export function DressCodeSection({theme = "base"}: Props = {}) {
    const t = useTranslations("dresscode");
    const [selected, setSelected] = useState<string | null>(null);

    const selectedColor = PALETTE.find((c) => c.hex === selected);

    return (
        <Section id="dresscode" theme={theme}>
            <SectionHeader title={t("title")} subtitle={t("subtitle")}/>

            <div className={cn(DEFAULT_PALETTE_CLASS_NAME, `sm:grid-cols-${PALETTE.length}`)}>
                {PALETTE.map((color) => (
                    <button
                        key={color.hex}
                        type="button"
                        onClick={() => setSelected(selected === color.hex ? null : color.hex)}
                        className="group flex flex-col items-center gap-2"
                        title={t(`colors.${color.key}`)}
                    >
                        <div
                            className={cn(
                                "h-14 w-14 " +
                                "rounded-pill " +
                                "border-4 " +
                                "transition-all " +
                                "duration-300 " +
                                "sm:h-16 sm:w-16",
                                "group-hover:scale-110",
                                selected === color.hex
                                    ? "scale-110 border-text-primary shadow-card"
                                    : "border-transparent",
                            )}
                            style={{background: color.hex}}
                        />
                        <span className="text-center text-xs leading-tight text-text-muted">
                            {t(`colors.${color.key}`)}
                        </span>
                        {!color.allowed ? (
                            <span className="text-xs text-red-400">{t("notAllowed")}</span>
                        ) : null}
                    </button>
                ))}
            </div>

            {selectedColor ? (
                <div
                    className="mx-auto max-w-sm rounded-lg p-8 text-center shadow-card transition-all duration-300"
                    style={{background: selectedColor.hex}}
                >
                    <p
                        className={`font-display text-h3 ${selectedColor.allowed ? "text-text-primary" : "text-red-700"}`}
                    >
                        {selectedColor.allowed ? t("yourColor") : t("notYourColor")}
                    </p>
                    <p className="mt-1 text-small text-text-secondary">
                        {t(`colors.${selectedColor.key}`)}
                    </p>
                </div>
            ) : null}
        </Section>
    );
}
