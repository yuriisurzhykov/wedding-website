import {z} from 'zod'

import {scheduleIconPresetSchema} from './schedule-icon-preset'

const SCHEDULE_ISSUE_CODE = /^[A-Z][A-Z0-9_]*$/

/**
 * Maps a failed {@link weddingScheduleReplacePayloadSchema} parse to a stable machine code for HTTP/i18n.
 * Falls back to `SCHEDULE_ITEM_FIELDS_INVALID` when no custom code is present on issues.
 */
export function scheduleReplacePayloadValidationCode(err: z.ZodError): string {
    for (const issue of err.issues) {
        if (typeof issue.message === 'string' && SCHEDULE_ISSUE_CODE.test(issue.message)) {
            return issue.message
        }
    }
    return 'SCHEDULE_ITEM_FIELDS_INVALID'
}

const optionalNullableText = z.union([z.string().max(4000), z.null()]).optional()

/**
 * Section copy for admin replace-all. Null/omit means “use site default messages” on the guest page.
 */
export const weddingScheduleSectionPatchSchema = z
    .object({
        title_ru: optionalNullableText,
        title_en: optionalNullableText,
        subtitle_ru: optionalNullableText,
        subtitle_en: optionalNullableText,
        emphasis_badge_ru: optionalNullableText,
        emphasis_badge_en: optionalNullableText,
    })
    .strict()

export type WeddingScheduleSectionPatch = z.infer<typeof weddingScheduleSectionPatchSchema>

function atMostOneIcon(
    preset: unknown,
    inline: unknown,
    url: unknown,
): boolean {
    const n =
        (preset != null ? 1 : 0) +
        (typeof inline === 'string' && inline.trim() !== '' ? 1 : 0) +
        (typeof url === 'string' && url.trim() !== '' ? 1 : 0)
    return n <= 1
}

/** One timeline row in the admin replace-all payload (before server-side SVG sanitization). */
export const weddingScheduleReplaceItemSchema = z
    .object({
        id: z.string().uuid('SCHEDULE_ITEM_ID_INVALID').optional(),
        hour: z.number().int().min(0, 'SCHEDULE_HOUR_INVALID').max(23, 'SCHEDULE_HOUR_INVALID'),
        minute: z.number().int().min(0, 'SCHEDULE_MINUTE_INVALID').max(59, 'SCHEDULE_MINUTE_INVALID'),
        title_ru: z.string().max(4000, 'SCHEDULE_TITLE_TOO_LONG'),
        title_en: z.string().max(4000, 'SCHEDULE_TITLE_TOO_LONG'),
        desc_ru: z.string().max(8000, 'SCHEDULE_DESC_TOO_LONG'),
        desc_en: z.string().max(8000, 'SCHEDULE_DESC_TOO_LONG'),
        location: z.string().max(2000, 'SCHEDULE_LOCATION_TOO_LONG'),
        location_url: z.string().max(4000, 'SCHEDULE_LOCATION_URL_TOO_LONG'),
        emphasis: z.boolean(),
        icon_preset: scheduleIconPresetSchema.nullable().optional(),
        icon_svg_inline: z.string().max(96000, 'SCHEDULE_ICON_SVG_TOO_LONG').nullable().optional(),
        icon_url: z.string().max(4000, 'SCHEDULE_ICON_URL_TOO_LONG').nullable().optional(),
    })
    .strict()
    .refine((row) => atMostOneIcon(row.icon_preset, row.icon_svg_inline, row.icon_url), {
        message: 'SCHEDULE_ICON_EXCLUSIVE',
    })

export type WeddingScheduleReplaceItem = z.infer<typeof weddingScheduleReplaceItemSchema>

/** Body for `PATCH /api/admin/schedule` — replaces every item and updates section copy. */
export const weddingScheduleReplacePayloadSchema = z
    .object({
        section: weddingScheduleSectionPatchSchema.optional(),
        items: z
            .array(weddingScheduleReplaceItemSchema)
            .min(1, 'SCHEDULE_ITEMS_EMPTY')
            .max(64, 'SCHEDULE_ITEMS_TOO_MANY'),
    })
    .strict()
    .refine(
        (body) => {
            const ids = body.items.map((i) => i.id).filter((x): x is string => x != null)
            return new Set(ids).size === ids.length
        },
        {message: 'SCHEDULE_DUPLICATE_IDS'},
    )
    .refine(
        (body) => body.items.filter((i) => i.emphasis).length <= 1,
        {message: 'SCHEDULE_MULTIPLE_EMPHASIS'},
    )

export type WeddingScheduleReplacePayload = z.infer<typeof weddingScheduleReplacePayloadSchema>
