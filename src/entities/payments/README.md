# Entity: payments

Configuration for future or current “donate / gift” payment buttons: service metadata, deep links, and fallbacks built from server environment variables (`PAYMENTS_*` per `.env.example`).

## Public API

- `PAYMENT_SERVICES` — array of `PaymentConfig` (Venmo, Cash App, PayPal, Zelle).
- `ZELLE_PHONE_NUMBER` — display value for Zelle when configured.
- `DeepLinkButton` — client button wired to `donate` i18n and Zelle clipboard behavior.
- Types: `PaymentService`, `PaymentConfig`.

## When to use

- **UI:** `@widgets/donate-section`, UI book — import `DeepLinkButton` and configs from `@entities/payments`, not ad-hoc constants.

## Environment

`PAYMENTS_VENMO_USERNAME`, `PAYMENTS_CASHAPP_TAG`, `PAYMENTS_PAYPAL_ID`, `PAYMENTS_ZELLE_PHONE` — empty strings in the bundle if unset (e.g. client-only usage without public env vars).

## Extending

Add a new `PaymentService` union member and a `PaymentConfig` entry; document the new env var in `.env.example` and ARCHITECTURE if it is part of the product contract.
