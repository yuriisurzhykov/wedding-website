import "server-only";

import {z} from "zod";

import type {RsvpFormInput} from "@entities/rsvp";
import {
    isGuestDisplayNameWithinStoredLimit,
    normalizeGuestDisplayNameForPartyUniqueness,
} from "@entities/guest-account";
import {isUsPhoneValid, normalizeUsPhoneToE164} from "@shared/lib/phone";

import type {GuestEmailLocale} from "./email/guest-confirmation-copy";

function emptyToUndefined(v: unknown): unknown {
    if (v === null || v === undefined) return undefined;
    if (typeof v === "string" && v.trim() === "") return undefined;
    return v;
}

const optionalPhone = z.preprocess(
    emptyToUndefined,
    z.string().trim().max(40).optional(),
);

const optionalEmail = z.preprocess(
    emptyToUndefined,
    z.string().trim().max(320).pipe(z.email()).optional(),
);

const guestCountInput = z.preprocess(emptyToUndefined, z.unknown());

const companionNamesInput = z.preprocess((v) => {
    if (v === undefined || v === null) {
        return [];
    }
    if (!Array.isArray(v)) {
        return [];
    }
    return v.map((item) => (typeof item === "string" ? item : String(item)));
}, z.array(z.string()));

/**
 * Raw JSON body from `POST /api/rsvp` (same keys the client form sends).
 * Validated output is {@link RsvpFormInput} for {@link mapRsvpFormToRow}.
 */
export const rsvpPayloadSchema = z
    .object({
        name: z.string().trim().min(1, "Name is required").max(200),
        email: optionalEmail,
        phone: optionalPhone,
        guestCount: guestCountInput,
        companionNames: companionNamesInput,
        dietary: z.preprocess(
            emptyToUndefined,
            z.string().trim().max(2000).optional(),
        ),
        message: z.preprocess(
            emptyToUndefined,
            z.string().trim().max(1000).optional(),
        ),
        attending: z.boolean(),
        locale: z.enum(["ru", "en"]).optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
        if (data.attending) {
            const raw = data.guestCount;
            let guestCountValid: number | null = null;

            if (raw !== undefined && raw !== null) {
                const n =
                    typeof raw === "number"
                        ? raw
                        : typeof raw === "string" && raw.trim() !== ""
                            ? Number(raw)
                            : NaN;
                if (!Number.isInteger(n) || n < 1 || n > 100) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message:
                            "Guest count must be a whole number from 1 to 100",
                        path: ["guestCount"],
                    });
                } else {
                    guestCountValid = n;
                }
            } else {
                guestCountValid = 1;
            }

            if (guestCountValid !== null) {
                const expectedCompanions = guestCountValid - 1;
                const companions = data.companionNames;

                if (companions.length !== expectedCompanions) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message:
                            expectedCompanions === 0
                                ? "No companion names are expected when guest count is 1"
                                : `Exactly ${expectedCompanions} companion name(s) are required for this guest count`,
                        path: ["companionNames"],
                    });
                }

                companions.forEach((rawName, index) => {
                    const trimmed = String(rawName ?? "").trim();
                    if (trimmed.length === 0) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: "Companion name cannot be empty",
                            path: ["companionNames", index],
                        });
                    } else if (!isGuestDisplayNameWithinStoredLimit(trimmed)) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: "Companion name is too long",
                            path: ["companionNames", index],
                        });
                    }
                });

                const primaryKey = normalizeGuestDisplayNameForPartyUniqueness(
                    data.name,
                );
                const keys = new Set<string>([primaryKey]);
                for (const rawName of companions) {
                    const trimmed = String(rawName ?? "").trim();
                    const key =
                        normalizeGuestDisplayNameForPartyUniqueness(trimmed);
                    if (keys.has(key)) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message:
                                "Each guest name in the party must be different",
                            path: ["companionNames"],
                        });
                        break;
                    }
                    keys.add(key);
                }
            }
        }

        const rawPhone = data.phone;
        if (
            rawPhone !== undefined &&
            rawPhone !== null &&
            String(rawPhone).trim() !== ""
        ) {
            if (!isUsPhoneValid(String(rawPhone))) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        "Enter a valid US phone number, or leave this field empty.",
                    path: ["phone"],
                });
            }
        }
    })
    .transform(
        (data): { form: RsvpFormInput; locale: GuestEmailLocale } => {
            const {locale: localeRaw, ...rest} = data;
            const locale = (localeRaw ?? "en") as GuestEmailLocale;
            const phone =
                rest.phone && String(rest.phone).trim()
                    ? normalizeUsPhoneToE164(String(rest.phone))
                    : undefined;
            const companionNames = rest.attending
                ? rest.companionNames.map((s) => String(s ?? "").trim())
                : [];
            return {
                form: {
                    name: rest.name,
                    email: rest.email,
                    phone,
                    guestCount: rest.guestCount as RsvpFormInput["guestCount"],
                    companionNames,
                    dietary: rest.dietary,
                    message: rest.message,
                    attending: rest.attending,
                },
                locale,
            };
        },
    );

export type RsvpPayloadParseResult =
    | { ok: true; data: RsvpFormInput; locale: GuestEmailLocale }
    | { ok: false; error: z.ZodError };

/**
 * Parses and validates an RSVP JSON body.
 *
 * @param raw — Typically `await request.json()`; must be a plain object with expected keys.
 * @returns Discriminated union: success carries {@link RsvpFormInput} and email locale; failure carries `ZodError` (use `.flatten()` for HTTP 400).
 */
export function parseRsvpPayload(raw: unknown): RsvpPayloadParseResult {
    const result = rsvpPayloadSchema.safeParse(raw);
    if (!result.success) {
        return {ok: false, error: result.error};
    }
    return {ok: true, data: result.data.form, locale: result.data.locale};
}
