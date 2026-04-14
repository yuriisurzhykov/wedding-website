"use client";

import {useEffect, useMemo} from "react";
import {useTranslations} from "next-intl";

import {Input, type DynamicFormSlotContext} from "@shared/ui";

const companionNameMaxChars = 200;

function resolveGuestCount(raw: unknown): number {
    if (raw === "" || raw === undefined || raw === null) {
        return 1;
    }
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function asStringArray(v: unknown): string[] {
    if (!Array.isArray(v)) {
        return [];
    }
    return v.map((item) => (typeof item === "string" ? item : String(item ?? "")));
}

/**
 * Syncs `companionNames` length to `guestCount - 1` and renders one text field per companion (RSVP party).
 */
export function RsvpCompanionNamesSlot({ctx}: {ctx: DynamicFormSlotContext}) {
    const t = useTranslations("rsvp.companions");
    const {values, setValue} = ctx;

    const attending = values.attending === true;
    const guestCount = resolveGuestCount(values.guestCount);
    const expected = attending ? Math.max(0, guestCount - 1) : 0;
    const companionNamesRaw = values.companionNames;

    const row = useMemo(
        () => asStringArray(companionNamesRaw),
        [companionNamesRaw],
    );

    useEffect(() => {
        if (!attending) {
            return;
        }
        if (row.length === expected) {
            return;
        }
        const next = row.slice(0, expected);
        while (next.length < expected) {
            next.push("");
        }
        setValue("companionNames", next);
    }, [attending, expected, row, setValue]);

    if (!attending || expected === 0) {
        return null;
    }

    const displayRow = Array.from({length: expected}, (_, i) => row[i] ?? "");

    return (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg-section/40 p-4">
            <div className="flex flex-col gap-1">
                <p className="text-small font-medium text-text-secondary">{t("heading")}</p>
                <p className="text-small text-text-muted">{t("hint")}</p>
            </div>
            <div className="flex flex-col gap-4">
                {displayRow.map((value, index) => (
                    <div key={index} className="flex flex-col gap-1.5">
                        <label
                            htmlFor={`companionNames.${index}`}
                            className="text-small font-medium text-text-secondary"
                        >
                            {t("fieldLabel", {n: index + 1})}
                        </label>
                        <Input
                            id={`companionNames.${index}`}
                            name={`companionNames.${index}`}
                            type="text"
                            required
                            autoComplete="name"
                            placeholder={t("placeholder")}
                            value={value}
                            maxLength={companionNameMaxChars}
                            onChange={(e) => {
                                const raw = e.target.value;
                                const updated = Array.from({length: expected}, (_, i) =>
                                    i === index ? raw : displayRow[i] ?? "",
                                );
                                setValue("companionNames", updated);
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
