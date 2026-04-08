import {DAY_PROGRAM_TIMELINE} from '../config/day-program'
import {getProgramInstantOnWeddingDay} from './resolve-instants'

export type DayProgramRow = (typeof DAY_PROGRAM_TIMELINE)[number]

export type ScheduleItem = DayProgramRow & { instant: Date }

export function getScheduleItems(): ScheduleItem[] {
    return DAY_PROGRAM_TIMELINE.map((row) => ({
        ...row,
        instant: getProgramInstantOnWeddingDay(row.hour, row.minute),
    }))
}
