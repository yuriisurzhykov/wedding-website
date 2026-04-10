# Entity: payments

Donate / gift buttons: metadata, deep links, and HTTPS fallbacks built from server env (`PAYMENTS_*`). Identifiers are *
*parsed and validated** before any URL is emitted — empty or malformed env does not produce placeholder links like
`https://paypal.me/`.

## Public API

- `PAYMENT_SERVICES` — only services that passed validation (subset of Venmo, Cash App, PayPal, Zelle).
- `ZELLE_PHONE_NUMBER` — digits-only phone when Zelle is configured; otherwise `''`.
- `isPaymentConfigured(service)` — asserts non-empty, scheme-appropriate deep links and HTTPS fallbacks (or valid Zelle
  phone on the config). Use when filtering or sanity-checking `PaymentConfig`.
- `DeepLinkButton` — client button; Zelle copies `service.zellePhone`.
- Types: `PaymentService`, `PaymentConfig` (`zellePhone` optional, set for Zelle).

### Internal (not exported)

- `model/payment-credentials.ts` — `parseVenmoUsername`, `parseCashAppCashtag`, `parsePayPalMeHandle`,
  `parseZellePhone`.
- `model/build-payment-links.ts` — `buildVenmoUrls`, `buildCashAppUrls`, `buildPayPalUrls`.

## Environment

| Variable                  | Expected                                                  | Notes                       |
|---------------------------|-----------------------------------------------------------|-----------------------------|
| `PAYMENTS_VENMO_USERNAME` | `@` optional; 3–100 chars `[a-zA-Z0-9_-]`                 |                             |
| `PAYMENTS_CASHAPP_TAG`    | Leading `$` optional; cashtag pattern                     | URLs: `https://cash.app/$…` |
| `PAYMENTS_PAYPAL_ID`      | `paypal.me` handle **or** full `https://paypal.me/handle` | Path segment validated      |
| `PAYMENTS_ZELLE_PHONE`    | 10–15 digits (non-digits stripped)                        | Stored normalized on config |

Unset or invalid values omit that provider from `PAYMENT_SERVICES`.

## When to use

- **UI:** `@widgets/donate-section` — import `DeepLinkButton`, `PAYMENT_SERVICES`, `isPaymentConfigured` from
  `@entities/payments`.

## Extending

Add a `PaymentService` variant, parsers + URL builder in `model/`, append in `buildPaymentServices()`, document the env
var in `.env.example` and product docs.
