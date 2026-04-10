import type {ComponentType, SVGProps} from 'react'

import type {ScheduleItem} from '@shared/lib/wedding-calendar'

import {CeremonyIcon} from './CeremonyIcon'
import {DinnerIcon} from './DinnerIcon'
import {GatheringIcon} from './GatheringIcon'
import {ReceptionIcon} from './ReceptionIcon'

export {CeremonyIcon, DinnerIcon, GatheringIcon, ReceptionIcon}

export type ScheduleIconId = ScheduleItem['iconId']

const SCHEDULE_ICON_MAP: Record<
    ScheduleIconId,
    ComponentType<SVGProps<SVGSVGElement>>
> = {
    gathering: GatheringIcon,
    ceremony: CeremonyIcon,
    reception: ReceptionIcon,
    dinner: DinnerIcon,
}

/**
 * Resolves the vector icon component for a day-program `iconId`.
 */
export function getScheduleIcon(
    id: ScheduleIconId,
): ComponentType<SVGProps<SVGSVGElement>> {
    return SCHEDULE_ICON_MAP[id]
}
