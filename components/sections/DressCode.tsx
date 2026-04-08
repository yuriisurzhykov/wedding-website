"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PALETTE } from "@/lib/config/dresscode";
import { cn } from "@/lib/utils";

export function DressCode() {
  const t = useTranslations("dresscode");
  const [selected, setSelected] = useState<string | null>(null);

  const selectedColor = PALETTE.find((c) => c.hex === selected);

  return (
    <Section id="dresscode">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="mb-10 grid grid-cols-4 justify-items-center gap-4 sm:grid-cols-7">
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
                "h-14 w-14 rounded-pill border-4 transition-all duration-300 sm:h-16 sm:w-16",
                "group-hover:scale-110",
                selected === color.hex
                  ? "scale-110 border-text-primary shadow-card"
                  : "border-transparent",
                !color.allowed && "opacity-40",
              )}
              style={{ background: color.hex }}
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
          style={{ background: selectedColor.hex }}
        >
          <p
            className="font-display text-h3"
            style={{
              color: selectedColor.allowed ? "#2C2420" : "#991B1B",
            }}
          >
            {selectedColor.allowed ? t("yourColor") : t("notYourColor")}
          </p>
          <p className="mt-1 text-small" style={{ color: "#6B5C54" }}>
            {t(`colors.${selectedColor.key}`)}
          </p>
        </div>
      ) : null}
    </Section>
  );
}
