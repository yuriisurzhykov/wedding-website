import {z} from 'zod'

/** Values accepted by `schedule_items.icon_preset` and {@link getScheduleIcon}. */
export const SCHEDULE_ICON_PRESET_VALUES = [
    'gathering',
    'ceremony',
    'reception',
    'dinner',
] as const

export type ScheduleIconPresetId = (typeof SCHEDULE_ICON_PRESET_VALUES)[number]

export const scheduleIconPresetSchema = z.enum(SCHEDULE_ICON_PRESET_VALUES, {
    message: 'SCHEDULE_ICON_PRESET_INVALID',
})
