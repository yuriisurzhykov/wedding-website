export interface ScheduleItem {
    id: string
    time: string
    icon: string
    titleKey: string
    descKey: string
    location?: string
    locationUrl?: string
}

export const SCHEDULE: ScheduleItem[] = [
    {
        id: 'gathering',
        time: '14:00',
        icon: '🏛️',
        titleKey: 'schedule.items.gathering.title',
        descKey: 'schedule.items.gathering.desc',
        location: 'Premier Palace Hotel — lobby bar',
        locationUrl:
            'https://www.google.com/maps/search/?api=1&query=Premier+Palace+Hotel+Pushkinska+Kyiv',
    },
    {
        id: 'ceremony',
        time: '15:00',
        icon: '💍',
        titleKey: 'schedule.items.ceremony.title',
        descKey: 'schedule.items.ceremony.desc',
        location: "St. Andrew's Church",
        locationUrl:
            'https://www.google.com/maps/search/?api=1&query=St+Andrew%27s+Church+Andriivskyi+Descent+23+Kyiv',
    },
    {
        id: 'reception',
        time: '17:00',
        icon: '🚗',
        titleKey: 'schedule.items.reception.title',
        descKey: 'schedule.items.reception.desc',
        location: 'Transfer to banquet hall — same hotel',
        locationUrl:
            'https://www.google.com/maps/search/?api=1&query=Premier+Palace+Hotel+Pushkinska+Kyiv',
    },
    {
        id: 'dinner',
        time: '18:00',
        icon: '🥂',
        titleKey: 'schedule.items.dinner.title',
        descKey: 'schedule.items.dinner.desc',
        location: 'Premier Palace Hotel — ballroom',
        locationUrl:
            'https://www.google.com/maps/search/?api=1&query=Premier+Palace+Hotel+Pushkinska+Kyiv',
    },
]
