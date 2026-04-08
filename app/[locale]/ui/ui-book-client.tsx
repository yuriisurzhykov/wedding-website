'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Countdown } from '@/components/ui/Countdown'
import { DeepLinkButton } from '@/components/ui/DeepLinkButton'
import { DynamicForm } from '@/components/ui/DynamicForm'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { Navigation } from '@/components/ui/Navigation'
import {
  mockPhotoUploadAdapter,
  PhotoUploader,
} from '@/components/ui/PhotoUploader'
import { cn } from '@/lib/utils'
import type { FormField } from '@/lib/config/rsvp'
import { PAYMENT_SERVICES } from '@/lib/config/payments'

const futureTarget = new Date(Date.now() + 86400000 * 120)
const pastTarget = new Date('2000-01-01T12:00:00')

const bookFormFields: FormField[] = [
  { key: 'name', type: 'text', required: true },
  {
    key: 'guestCount',
    type: 'select',
    showWhen: (v) => v.attending === true,
    options: [
      { value: 1, labelKey: '1' },
      { value: 2, labelKey: '2' },
      { value: 3, labelKey: '3' },
    ],
    transform: (v) => (v === '' ? '' : Number(v)),
  },
  { key: 'marketing', type: 'checkbox' },
]

function PhotoUploaderStatesShowcase() {
  const t = useTranslations('gallery')

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-2">
        <p className="text-small font-medium text-text-secondary">Empty</p>
        <PhotoUploader uploadAdapter={mockPhotoUploadAdapter} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-small font-medium text-text-secondary">Drag over</p>
        <div
          className={cn(
            'cursor-pointer rounded-lg border-2 border-dashed p-10 text-center',
            'border-primary bg-primary/5',
          )}
          aria-hidden
        >
          <p className="mb-1 text-text-secondary">{t('dropzone')}</p>
          <p className="text-small text-text-muted">{t('maxSize')}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-small font-medium text-text-secondary">
          Uploading list
        </p>
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-bg-card p-4">
          {[
            { name: 'photo-a.jpg', progress: 100, state: 'done' as const },
            { name: 'photo-b.jpg', progress: 62, state: 'uploading' as const },
            { name: 'photo-c.jpg', progress: 0, state: 'error' as const },
          ].map((row) => (
            <div key={row.name} className="flex items-center gap-3">
              <span className="flex-1 truncate text-small text-text-secondary">
                {row.name}
              </span>
              {row.state === 'uploading' ? (
                <div className="h-1.5 w-24 overflow-hidden rounded-pill bg-border">
                  <div
                    className="h-full bg-primary transition-all duration-fast"
                    style={{ width: `${row.progress}%` }}
                  />
                </div>
              ) : null}
              {row.state === 'done' ? (
                <span className="text-small text-green-500" aria-hidden>
                  ✓
                </span>
              ) : null}
              {row.state === 'error' ? (
                <span className="text-small text-red-400" aria-hidden>
                  ✗
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DynamicFormBookDemo() {
  const [failNext, setFailNext] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  return (
    <div className="flex flex-col gap-4">
      <label className="flex cursor-pointer items-center gap-2 text-small text-text-secondary">
        <input
          type="checkbox"
          className="accent-primary h-4 w-4"
          checked={failNext}
          onChange={(e) => setFailNext(e.target.checked)}
        />
        Force submit error (demo)
      </label>
      <DynamicForm
        key={resetKey}
        fields={bookFormFields}
        namespace="rsvp"
        onSubmitAction={async () => {
          await new Promise((r) => setTimeout(r, 700))
          if (failNext) throw new Error('demo')
        }}
      />
      <button
        type="button"
        className="text-small text-primary underline underline-offset-2"
        onClick={() => {
          setResetKey((k) => k + 1)
        }}
      >
        Reset form demo
      </button>
    </div>
  )
}

export function UIBookClientSections() {
  const venmo = PAYMENT_SERVICES.find((s) => s.id === 'venmo')
  const zelle = PAYMENT_SERVICES.find((s) => s.id === 'zelle')

  return (
    <>
      <section
        id="language-switcher"
        className="scroll-mt-24 rounded-lg border border-border bg-bg-card p-6"
      >
        <h3 className="text-h3 font-display text-text-primary mb-2">
          LanguageSwitcher
        </h3>
        <p className="text-body text-text-secondary mb-4">
          Toggles locale; path stays on this UI book route.
        </p>
        <LanguageSwitcher />
      </section>

      <section id="navigation" className="scroll-mt-24">
        <h3 className="text-h3 font-display text-text-primary mb-2">
          Navigation
        </h3>
        <p className="text-body text-text-secondary mb-4">
          Fixed bar (demo). Scroll the page to see it stick to the viewport.
        </p>
        <Navigation />
      </section>

      <section id="countdown" className="scroll-mt-24">
        <h3 className="text-h3 font-display text-text-primary mb-2">
          Countdown
        </h3>
        <p className="text-body text-text-secondary mb-6">
          Before target date vs passed state.
        </p>
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="text-small text-text-muted mb-3">Before date</p>
            <Countdown targetDate={futureTarget} />
          </div>
          <div>
            <p className="text-small text-text-muted mb-3">Passed</p>
            <Countdown targetDate={pastTarget} />
          </div>
        </div>
      </section>

      <section id="dynamic-form" className="scroll-mt-24">
        <h3 className="text-h3 font-display text-text-primary mb-2">
          DynamicForm
        </h3>
        <p className="text-body text-text-secondary mb-6">
          Text, select (when attending), checkbox; mock submit with optional
          error.
        </p>
        <DynamicFormBookDemo />
      </section>

      <section id="photo-uploader" className="scroll-mt-24">
        <h3 className="text-h3 font-display text-text-primary mb-2">
          PhotoUploader
        </h3>
        <p className="text-body text-text-secondary mb-6">
          Live mock upload, static drag-over, and static progress list.
        </p>
        <PhotoUploaderStatesShowcase />
      </section>

      <section id="deep-link-button" className="scroll-mt-24">
        <h3 className="text-h3 font-display text-text-primary mb-2">
          DeepLinkButton
        </h3>
        <p className="text-body text-text-secondary mb-6">
          Deep link (Venmo) vs Zelle copy-to-clipboard flow.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
          {venmo ? <DeepLinkButton service={venmo} /> : null}
          {zelle ? <DeepLinkButton service={zelle} /> : null}
        </div>
      </section>
    </>
  )
}
