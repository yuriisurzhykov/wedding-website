import {
    getScheduleItems,
    type ScheduleItem,
} from '@/lib/wedding-calendar'

export type {ScheduleItem}

/** Built from `lib/wedding-calendar/config/day-program.ts` */
export const SCHEDULE: ScheduleItem[] = getScheduleItems()
