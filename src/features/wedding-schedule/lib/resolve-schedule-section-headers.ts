import type {ScheduleSectionRow} from '@entities/wedding-schedule'

/** Picks nullable section strings for the active locale (null means use `messages` fallback on the page). */
export function resolveScheduleSectionHeaders(
    section: ScheduleSectionRow | null,
    locale: string,
): {
    title: string | null
    subtitle: string | null
    emphasisBadge: string | null
} {
    const useRu = locale === 'ru'
    if (!section) {
        return {title: null, subtitle: null, emphasisBadge: null}
    }
    return {
        title: useRu ? section.title_ru : section.title_en,
        subtitle: useRu ? section.subtitle_ru : section.subtitle_en,
        emphasisBadge: useRu ? section.emphasis_badge_ru : section.emphasis_badge_en,
    }
}
