# Shared UI: `dynamic-form`

Config-driven RSVP-style form: attending toggle, declarative `fields`, and optional **slots** for extra UI without lifting all state to parents.

## Purpose

- One client component for flows that share the same shape (boolean attending, `showWhen`, submit lifecycle).
- Callers supply `FormField[]` and `namespace` (next-intl); domain stays in entities / widgets.

## Public surface

- `DynamicForm` — `'use client'`; props: `fields`, `namespace`, `onSubmitAction`, optional `slotAfterField`.
- Types: `FormField`, `FormValues`, `DynamicFormSlotContext` (from `./types` via `@shared/ui`).

## Extension: `slotAfterField`

Map keyed by **field `key`**. The callback receives `{ values, setValue }` where `values` is the same merged bag passed into each field (including `attending`). Use it to render blocks that still belong to the same submit payload (e.g. companion name inputs after `guestCount`).

- Do not leak full React state; only use `setValue` to write additional keys consumed by `onSubmitAction`.
- Slots render **after** the field row, even when `showWhen` hides the field (return `null` from the slot when the block should not appear).

## Errors

Submit errors are surfaced with a single message key (`{namespace}.error`); field-level API errors are not wired here yet.
