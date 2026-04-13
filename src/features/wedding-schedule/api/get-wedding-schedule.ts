import 'server-only'

import {
    scheduleItemRowSchema,
    scheduleSectionRowSchema,
    type ScheduleItemRow,
    type ScheduleSectionRow,
} from '@entities/wedding-schedule'
import {createPublishableServerClient} from '@shared/api/supabase/publishable-server-client'
import {unstable_cache} from 'next/cache'

/** Passed to `revalidateTag` after admin schedule writes. */
export const WEDDING_SCHEDULE_CACHE_TAG = 'wedding-schedule'

export type WeddingScheduleSnapshot = {
    section: ScheduleSectionRow | null
    items: ScheduleItemRow[]
}

function parseSection(raw: unknown): ScheduleSectionRow | null {
    const parsed = scheduleSectionRowSchema.safeParse(raw)
    return parsed.success ? parsed.data : null
}

function parseItems(raw: unknown): ScheduleItemRow[] {
    if (!Array.isArray(raw)) {
        return []
    }
    const out: ScheduleItemRow[] = []
    for (const row of raw) {
        const parsed = scheduleItemRowSchema.safeParse(row)
        if (parsed.success) {
            out.push(parsed.data)
        }
    }
    return out
}

async function readWeddingScheduleFromDatabase(): Promise<WeddingScheduleSnapshot> {
    try {
        const supabase = createPublishableServerClient()
        const [sectionRes, itemsRes] = await Promise.all([
            supabase.from('schedule_section').select('*').eq('id', 'default').maybeSingle(),
            supabase.from('schedule_items').select('*').order('sort_order', {ascending: true}),
        ])

        if (sectionRes.error && process.env.NODE_ENV === 'development') {
            console.warn('[wedding-schedule] schedule_section read failed:', sectionRes.error.message)
        }
        if (itemsRes.error && process.env.NODE_ENV === 'development') {
            console.warn('[wedding-schedule] schedule_items read failed:', itemsRes.error.message)
        }

        return {
            section: parseSection(sectionRes.data),
            items: parseItems(itemsRes.data),
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        if (process.env.NODE_ENV === 'development') {
            console.warn('[wedding-schedule] read threw:', message)
        }
        return {section: null, items: []}
    }
}

/** Uncached read (e.g. admin preview). */
export async function getWeddingSchedule(): Promise<WeddingScheduleSnapshot> {
    return readWeddingScheduleFromDatabase()
}

const getWeddingScheduleCachedInner = unstable_cache(
    async () => readWeddingScheduleFromDatabase(),
    ['wedding-schedule'],
    {
        revalidate: 60,
        tags: [WEDDING_SCHEDULE_CACHE_TAG],
    },
)

/** Cached read for the public home page and other RSC callers. */
export async function getWeddingScheduleCached(): Promise<WeddingScheduleSnapshot> {
    return getWeddingScheduleCachedInner()
}
