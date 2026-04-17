import type {FormField} from '@shared/ui/dynamic-form'

// =============================================
// THIS IS WHERE YOU ADD / REMOVE FORM FIELDS
// =============================================
export const RSVP_FIELDS: FormField[] = [
    {
        key: 'name',
        type: 'text',
        required: true,
    },
    {
        key: 'email',
        type: 'email',
        required: true,
    },
    {
        key: 'phone',
        type: 'tel',
    },
    {
        key: 'guestCount',
        type: 'select',
        showWhen: (v) => v.attending === true,
        options: [
            {value: 1, labelKey: '1'},
            {value: 2, labelKey: '2'},
            {value: 3, labelKey: '3'},
            {value: 4, labelKey: '4'},
            {value: 5, labelKey: '5'},
        ],
        transform: (v) => (v === '' ? '' : Number(v)),
    },
    {
        key: 'dietary',
        type: 'text',
        showWhen: (v) => v.attending === true,
    },
    {
        key: 'message',
        type: 'textarea',
        max: 1000,
    },
]
