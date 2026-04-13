import {z} from 'zod'

import {scheduleIconPresetSchema} from './schedule-icon-preset'

/** Singleton row in `schedule_section` (see migration). */
export const scheduleSectionRowSchema = z
    .object({
        id: z.literal('default'),
        updated_at: z.string(),
        title_ru: z.string().nullable(),
        title_en: z.string().nullable(),
        subtitle_ru: z.string().nullable(),
        subtitle_en: z.string().nullable(),
        emphasis_badge_ru: z.string().nullable(),
        emphasis_badge_en: z.string().nullable(),
    })
    .strict()

export type ScheduleSectionRow = z.infer<typeof scheduleSectionRowSchema>

/** One row in `schedule_items`. */
export const scheduleItemRowSchema = z
    .object({
        id: z.string().uuid(),
        sort_order: z.number().int(),
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59),
        title_ru: z.string(),
        title_en: z.string(),
        desc_ru: z.string(),
        desc_en: z.string(),
        location: z.string(),
        location_url: z.string(),
        emphasis: z.boolean(),
        icon_preset: scheduleIconPresetSchema.nullable(),
        icon_svg_inline: z.string().nullable(),
        icon_url: z.string().nullable(),
        updated_at: z.string(),
    })
    .strict()

export type ScheduleItemRow = z.infer<typeof scheduleItemRowSchema>
