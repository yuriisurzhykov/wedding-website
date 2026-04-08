import {
    getScheduleItems,
    type ScheduleItem,
} from '@shared/lib/wedding-calendar'

export type {ScheduleItem}

/** Built from `src/shared/lib/wedding-calendar/config/day-program.ts`. */
export const SCHEDULE: ScheduleItem[] = getScheduleItems()
