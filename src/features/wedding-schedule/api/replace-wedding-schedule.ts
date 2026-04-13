import 'server-only'

import {
    SCHEDULE_ICON_PRESET_VALUES,
    scheduleReplacePayloadValidationCode,
    weddingScheduleReplacePayloadSchema,
    type ScheduleItemRow,
    type ScheduleSectionRow,
    type WeddingScheduleReplaceItem,
    type WeddingScheduleReplacePayload,
    type WeddingScheduleSectionPatch,
} from '@entities/wedding-schedule'
import {createServerClient} from '@shared/api/supabase/server'
import {revalidateTag} from 'next/cache'

import {sanitizeScheduleIconSvgInline} from '../lib/sanitize-schedule-icon-svg'
import {getWeddingSchedule, WEDDING_SCHEDULE_CACHE_TAG} from './get-wedding-schedule'

export type ReplaceWeddingScheduleResult =
    | {ok: true; section: ScheduleSectionRow | null; items: ScheduleItemRow[]}
    | {ok: false; error: string}

function normalizeIconColumns(
    item: WeddingScheduleReplaceItem,
): Pick<
    ScheduleItemRow,
    'icon_preset' | 'icon_svg_inline' | 'icon_url'
> {
    const preset = item.icon_preset ?? null
    const rawInline = item.icon_svg_inline?.trim() ? item.icon_svg_inline : ''
    const sanitizedInline = rawInline ? sanitizeScheduleIconSvgInline(rawInline) : ''
    const url = item.icon_url?.trim() ? item.icon_url.trim() : ''

    if (preset != null) {
        return {icon_preset: preset, icon_svg_inline: null, icon_url: null}
    }
    if (sanitizedInline) {
        return {icon_preset: null, icon_svg_inline: sanitizedInline, icon_url: null}
    }
    if (url) {
        return {icon_preset: null, icon_svg_inline: null, icon_url: url}
    }
    return {
        icon_preset: SCHEDULE_ICON_PRESET_VALUES[0],
        icon_svg_inline: null,
        icon_url: null,
    }
}

function buildRowsForInsert(
    items: WeddingScheduleReplaceItem[],
): Omit<ScheduleItemRow, 'updated_at'>[] {
    return items.map((item, index) => {
        const icons = normalizeIconColumns(item)
        return {
            id: item.id ?? crypto.randomUUID(),
            sort_order: index,
            hour: item.hour,
            minute: item.minute,
            title_ru: item.title_ru,
            title_en: item.title_en,
            desc_ru: item.desc_ru,
            desc_en: item.desc_en,
            location: item.location,
            location_url: item.location_url,
            emphasis: item.emphasis,
            ...icons,
        }
    })
}

/**
 * Replaces all `schedule_items` and updates `schedule_section` in one logical save. SVG inline values are sanitized
 * before insert. Revalidates the wedding-schedule cache tag.
 */
export async function replaceWeddingSchedule(body: unknown): Promise<ReplaceWeddingScheduleResult> {
    const parsed = weddingScheduleReplacePayloadSchema.safeParse(body)
    if (!parsed.success) {
        return {ok: false, error: scheduleReplacePayloadValidationCode(parsed.error)}
    }

    const payload: WeddingScheduleReplacePayload = parsed.data

    try {
        const supabase = createServerClient()
        const before = await getWeddingSchedule()

        const sectionRow = mergeSection(before.section, payload.section)

        const {error: delError} = await supabase
            .from('schedule_items')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')

        if (delError) {
            console.error('[replaceWeddingSchedule] delete schedule_items', delError)
            return {ok: false, error: 'SCHEDULE_PERSISTENCE_FAILED'}
        }

        const insertRows = buildRowsForInsert(payload.items)
        const {error: insError} = await supabase.from('schedule_items').insert(insertRows)

        if (insError) {
            console.error('[replaceWeddingSchedule] insert schedule_items', insError)
            return {ok: false, error: 'SCHEDULE_PERSISTENCE_FAILED'}
        }

        const {error: secError} = await supabase.from('schedule_section').upsert(
            {
                id: 'default',
                title_ru: sectionRow.title_ru,
                title_en: sectionRow.title_en,
                subtitle_ru: sectionRow.subtitle_ru,
                subtitle_en: sectionRow.subtitle_en,
                emphasis_badge_ru: sectionRow.emphasis_badge_ru,
                emphasis_badge_en: sectionRow.emphasis_badge_en,
            },
            {onConflict: 'id'},
        )

        if (secError) {
            console.error('[replaceWeddingSchedule] upsert schedule_section', secError)
            return {ok: false, error: 'SCHEDULE_PERSISTENCE_FAILED'}
        }

        revalidateTag(WEDDING_SCHEDULE_CACHE_TAG, 'max')

        const after = await getWeddingSchedule()
        return {ok: true, section: after.section, items: after.items}
    } catch (e) {
        console.error('[replaceWeddingSchedule]', e)
        return {ok: false, error: 'SCHEDULE_PERSISTENCE_FAILED'}
    }
}

function mergeSection(
    current: ScheduleSectionRow | null,
    patch: WeddingScheduleSectionPatch | undefined,
): Pick<
    ScheduleSectionRow,
    | 'title_ru'
    | 'title_en'
    | 'subtitle_ru'
    | 'subtitle_en'
    | 'emphasis_badge_ru'
    | 'emphasis_badge_en'
> {
    const base = {
        title_ru: current?.title_ru ?? null,
        title_en: current?.title_en ?? null,
        subtitle_ru: current?.subtitle_ru ?? null,
        subtitle_en: current?.subtitle_en ?? null,
        emphasis_badge_ru: current?.emphasis_badge_ru ?? null,
        emphasis_badge_en: current?.emphasis_badge_en ?? null,
    }
    if (!patch) {
        return base
    }
    return {
        title_ru: patch.title_ru !== undefined ? patch.title_ru : base.title_ru,
        title_en: patch.title_en !== undefined ? patch.title_en : base.title_en,
        subtitle_ru: patch.subtitle_ru !== undefined ? patch.subtitle_ru : base.subtitle_ru,
        subtitle_en: patch.subtitle_en !== undefined ? patch.subtitle_en : base.subtitle_en,
        emphasis_badge_ru:
            patch.emphasis_badge_ru !== undefined ? patch.emphasis_badge_ru : base.emphasis_badge_ru,
        emphasis_badge_en:
            patch.emphasis_badge_en !== undefined ? patch.emphasis_badge_en : base.emphasis_badge_en,
    }
}
