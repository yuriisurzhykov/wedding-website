export type FieldType =
    | 'text'
    | 'email'
    | 'tel'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'

/** Values bag for config-driven forms (`showWhen`, submit payload). */
export type FormValues = Record<string, unknown>

/**
 * Declarative field for the config-driven RSVP-style form. Domain slices supply
 * concrete `fields` arrays; this type stays in shared so the UI primitive has no
 * entity imports.
 */
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
