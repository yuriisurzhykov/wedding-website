'use client'

import React, {useState} from 'react'
import {useTranslations} from 'next-intl'
import {Button} from './Button'
import {Input} from './Input'
import {Select} from './Select'
import {TextArea} from './TextArea'
import {cn} from '@/lib/utils'
import type {FormField, FormValues} from '@/lib/config/rsvp'

type Status = 'idle' | 'submitting' | 'success' | 'error'

function FieldRenderer(
    {
        field,
        values,
        onChange,
        t,
    }: {
        field: FormField
        values: FormValues
        onChange: (key: string, value: unknown) => void
        t: ReturnType<typeof useTranslations>
    }
) {
    if (field.showWhen && !field.showWhen(values)) return null

    const label = t(`fields.${field.key}.label`)
    const placeholder = t(`fields.${field.key}.placeholder`)
    const rawValue = values[field.key]
    const value = rawValue === undefined || rawValue === null ? '' : String(rawValue)

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const raw = e.target.value
        if (field.type === 'select' && raw === '') {
            onChange(field.key, '')
            return
        }
        onChange(
            field.key,
            field.transform ? field.transform(raw) : raw,
        )
    }

    if (field.type === 'checkbox') {
        return (
            <label className="flex cursor-pointer items-center gap-3">
                <input
                    type="checkbox"
                    id={field.key}
                    checked={Boolean(values[field.key])}
                    onChange={(event) => onChange(field.key, event.target.checked)}
                    className="accent-primary h-4 w-4"
                />
                <span className="text-body text-text-primary">
                    {label}
                    {field.required ? (<span className="text-primary ml-1" aria-hidden>*</span>) : null}
                </span>
            </label>
        )
    }

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={field.key} className="text-small font-medium text-text-secondary">
                {label}
                {field.required ? (<span className="text-primary ml-1" aria-hidden>*</span>) : null}
            </label>

            {field.type === 'textarea' ? (
                <TextArea
                    id={field.key}
                    name={field.key}
                    required={field.required}
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    rows={4}
                    maxLength={field.max}
                />
            ) : field.type === 'select' ? (
                <Select
                    id={field.key}
                    name={field.key}
                    value={value}
                    onChange={handleChange}
                    required={field.required}
                >
                    <option value="">{placeholder || '—'}</option>
                    {field.options?.map((opt) => (
                        <option key={String(opt.value)} value={String(opt.value)}>
                            {opt.labelKey}
                        </option>
                    ))}
                </Select>
            ) : (
                <Input
                    id={field.key}
                    type={field.type}
                    name={field.key}
                    required={field.required}
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    min={field.min}
                    max={field.max}
                />
            )}
        </div>
    )
}

export function DynamicForm({
                                fields,
                                onSubmitAction,
                                namespace,
                            }: {
    fields: FormField[]
    onSubmitAction: (values: FormValues) => Promise<void>
    namespace: string
}) {
    const t = useTranslations(namespace)
    const [values, setValues] = useState<FormValues>({})
    const [attending, setAttending] = useState<boolean | null>(null)
    const [status, setStatus] = useState<Status>('idle')

    function handleChange(key: string, value: unknown) {
        setValues((prev) => ({...prev, [key]: value}))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (attending === null) return
        setStatus('submitting')
        try {
            await onSubmitAction({...values, attending})
            setStatus('success')
        } catch {
            setStatus('error')
        }
    }

    if (status === 'success') {
        return (
            <div className="py-12 text-center">
                <p className="text-h3 font-display text-text-primary">
                    {attending ? t('successAttend') : t('successDecline')}
                </p>
            </div>
        )
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-lg flex-col gap-5"
        >
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => {
                        setAttending(true)
                        handleChange('attending', true)
                    }}
                    className={cn(
                        'flex-1 rounded-lg border-2 py-4 font-medium transition-colors duration-fast',
                        attending === true
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-text-secondary hover:border-primary/50',
                    )}
                >
                    {t('willAttend')}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setAttending(false)
                        handleChange('attending', false)
                    }}
                    className={cn(
                        'flex-1 rounded-lg border-2 py-4 font-medium transition-colors duration-fast',
                        attending === false
                            ? 'border-text-muted bg-bg-section text-text-secondary'
                            : 'border-border text-text-secondary hover:border-text-muted/50',
                    )}
                >
                    {t('wontAttend')}
                </button>
            </div>

            {attending !== null &&
                fields.map((field) => (
                    <FieldRenderer
                        key={field.key}
                        field={field}
                        values={{...values, attending}}
                        onChange={handleChange}
                        t={t}
                    />
                ))}

            {attending !== null && (
                <>
                    {status === 'error' ? (
                        <p className="text-center text-small text-red-500">{t('error')}</p>
                    ) : null}
                    <Button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full"
                        size="lg"
                    >
                        {status === 'submitting' ? t('submitting') : t('submit')}
                    </Button>
                </>
            )}
        </form>
    )
}
