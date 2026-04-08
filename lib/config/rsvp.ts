export type FieldType =
    | 'text'
    | 'email'
    | 'tel'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'

export interface FormField {
    key: string
    type: FieldType
    required?: boolean
    min?: number
    max?: number
    options?: { value: string | number; labelKey: string }[]
    showWhen?: (values: FormValues) => boolean
    transform?: (value: string) => unknown
}

export type FormValues = Record<string, unknown>

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
