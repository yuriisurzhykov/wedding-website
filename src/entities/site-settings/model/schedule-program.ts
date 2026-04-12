import {z} from 'zod'

import {DAY_PROGRAM_TIMELINE} from '@shared/lib/wedding-calendar/config/day-program'

/** One schedule row as stored in `site_settings.schedule_program` (JSON), aligned with `DAY_PROGRAM_TIMELINE`. */
export const scheduleProgramItemSchema = z
    .object({
        id: z.string().min(1),
        iconId: z.string().min(1),
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59),
        titleKey: z.string().min(1),
        descKey: z.string().min(1),
        location: z.string(),
        locationUrl: z.string(),
        emphasis: z.boolean().default(false),
    })
    .strict()

export type ScheduleProgramItem = z.infer<typeof scheduleProgramItemSchema>

export const scheduleProgramSchema = z.array(scheduleProgramItemSchema)

/** Code default: same timeline as `day-program.ts`, plain objects for JSON/DB compatibility. */
export const DEFAULT_SCHEDULE_PROGRAM: ScheduleProgramItem[] = DAY_PROGRAM_TIMELINE.map((row) => ({
    id: row.id,
    iconId: row.iconId,
    hour: row.hour,
    minute: row.minute,
    titleKey: row.titleKey,
    descKey: row.descKey,
    location: row.location,
    locationUrl: row.locationUrl,
    emphasis: row.emphasis,
}))

function dedupeScheduleEmphasis(rows: ScheduleProgramItem[]): ScheduleProgramItem[] {
    let seen = false
    return rows.map((row) => {
        if (!row.emphasis) {
            return row
        }
        if (seen) {
            return {...row, emphasis: false}
        }
        seen = true
        return row
    })
}

/** When legacy JSON omits `emphasis` on every row, align with code defaults by `id`. */
function applyLegacyEmphasisFromDefaults(rows: ScheduleProgramItem[]): ScheduleProgramItem[] {
    const emphasisById = new Map(DEFAULT_SCHEDULE_PROGRAM.map((r) => [r.id, r.emphasis]))
    return rows.map((row) => ({
        ...row,
        emphasis: emphasisById.get(row.id) ?? false,
    }))
}

function isLegacyScheduleProgramWithoutEmphasisKeys(raw: unknown): boolean {
    return (
        Array.isArray(raw) &&
        raw.every(
            (item) =>
                item !== null &&
                typeof item === 'object' &&
                !Array.isArray(item) &&
                !('emphasis' in item),
        )
    )
}

/**
 * Parses JSON from DB; on failure or empty array returns {@link DEFAULT_SCHEDULE_PROGRAM}.
 *
 * **Migration:** rows that never stored `emphasis` inherit it from {@link DEFAULT_SCHEDULE_PROGRAM} by matching `id`.
 * If more than one row has `emphasis: true`, only the first in order is kept.
 */
export function parseScheduleProgramFromDb(raw: unknown): ScheduleProgramItem[] {
    const parsed = scheduleProgramSchema.safeParse(raw)
    if (!parsed.success || parsed.data.length === 0) {
        return DEFAULT_SCHEDULE_PROGRAM.map((row) => ({...row}))
    }
    const rows = parsed.data.map((row) => ({...row}))
    if (isLegacyScheduleProgramWithoutEmphasisKeys(raw)) {
        return applyLegacyEmphasisFromDefaults(rows)
    }
    return dedupeScheduleEmphasis(rows)
}
