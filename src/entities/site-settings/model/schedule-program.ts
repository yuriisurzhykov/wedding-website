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
}))

/**
 * Parses JSON from DB; on failure or empty array returns {@link DEFAULT_SCHEDULE_PROGRAM}.
 */
export function parseScheduleProgramFromDb(raw: unknown): ScheduleProgramItem[] {
    const parsed = scheduleProgramSchema.safeParse(raw)
    if (!parsed.success || parsed.data.length === 0) {
        return DEFAULT_SCHEDULE_PROGRAM.map((row) => ({...row}))
    }
    return parsed.data
}
