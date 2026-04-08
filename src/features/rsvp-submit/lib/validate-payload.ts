import "server-only";

import {z} from "zod";

import type {RsvpFormInput} from "@entities/rsvp";

import type {GuestEmailLocale} from "./email/guest-confirmation-copy";

function emptyToUndefined(v: unknown): unknown {
    if (v === null || v === undefined) return undefined;
    if (typeof v === "string" && v.trim() === "") return undefined;
    return v;
}

const optionalPhone = z.preprocess(
    emptyToUndefined,
    z.string().trim().max(50).optional(),
);

const optionalEmail = z.preprocess(
    emptyToUndefined,
    z.string().trim().email().max(320).optional(),
);

const guestCountInput = z.preprocess(emptyToUndefined, z.unknown());

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
        if (!data.attending) return;
        const raw = data.guestCount;
        if (raw === undefined || raw === null) return;
        const n =
            typeof raw === "number"
                ? raw
                : typeof raw === "string" && raw.trim() !== ""
                  ? Number(raw)
                  : NaN;
        if (!Number.isInteger(n) || n < 1 || n > 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Guest count must be a whole number from 1 to 100",
                path: ["guestCount"],
            });
        }
    })
    .transform(
        (data): {form: RsvpFormInput; locale: GuestEmailLocale} => {
            const {locale, ...rest} = data;
            return {
                form: {
                    name: rest.name,
                    email: rest.email,
                    phone: rest.phone,
                    guestCount: rest.guestCount as RsvpFormInput["guestCount"],
                    dietary: rest.dietary,
                    message: rest.message,
                    attending: rest.attending,
                },
                locale: locale ?? "en",
            };
        },
    );

export type RsvpPayloadParseResult =
    | {ok: true; data: RsvpFormInput; locale: GuestEmailLocale}
    | {ok: false; error: z.ZodError};

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
