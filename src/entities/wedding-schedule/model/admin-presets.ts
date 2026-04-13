import type {ScheduleIconPresetId} from './schedule-icon-preset'

/**
 * Local templates for the admin UI (icon + ru/en copy). Not tied to `messages/*` — presets copy literals into the form.
 */
export type WeddingScheduleAdminPreset = {
    segmentId: string
    icon_preset: ScheduleIconPresetId
    title_ru: string
    title_en: string
    desc_ru: string
    desc_en: string
}

/** Default templates aligned with the seeded program (see `schedule_items` migration). */
export const WEDDING_SCHEDULE_ADMIN_PRESETS: readonly WeddingScheduleAdminPreset[] = [
    {
        segmentId: 'gathering',
        icon_preset: 'gathering',
        title_ru: 'Сбор гостей',
        title_en: 'Guest arrival',
        desc_ru:
            'Встречаемся в WGBC, Battle Ground, WA. Приходите чуть заранее.',
        desc_en:
            'Meet at WGBC in Battle Ground, WA. Arrive a little early — we will greet you and head to the ceremony together.',
    },
    {
        segmentId: 'ceremony',
        icon_preset: 'ceremony',
        title_ru: 'Церемония',
        title_en: 'Ceremony',
        desc_ru:
            'Церемония на территории центра. Просим прийти примерно за десять минут до начала.',
        desc_en:
            'Wedding ceremony on campus. Please arrive about ten minutes before the start.',
    },
    {
        segmentId: 'reception',
        icon_preset: 'reception',
        title_ru: 'Приём',
        title_en: 'Reception',
        desc_ru: 'Вместе перейдём в зону приёма на той же площадке.',
        desc_en: "We'll move together to the reception area on the same campus.",
    },
    {
        segmentId: 'dinner',
        icon_preset: 'dinner',
        title_ru: 'Ужин и общение',
        title_en: 'Dinner & celebration',
        desc_ru: 'Ужин, общение, фотографии с парой (на той же площадке).',
        desc_en: 'Dinner, socializing, photo with couple  — still at WGBC.',
    },
    {
        segmentId: 'photo',
        icon_preset: 'dinner',
        title_ru: 'Совместное фото',
        title_en: 'Group Photo',
        desc_ru: 'Совместное фото с гостями.',
        desc_en: 'Group photo with the guests.',
    },
] as const

export function getWeddingSchedulePresetBySegmentId(
    segmentId: string,
): WeddingScheduleAdminPreset | undefined {
    return WEDDING_SCHEDULE_ADMIN_PRESETS.find((p) => p.segmentId === segmentId)
}
