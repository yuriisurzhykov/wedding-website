# `shared/lib`

Domain-agnostic helpers used across the app (FSD **shared** layer).

## Public API (`index.ts`)

| Export                                                                             | Module     | Role                                        |
|------------------------------------------------------------------------------------|------------|---------------------------------------------|
| `cn`                                                                               | `cn.ts`    | Tailwind + `clsx` merge                     |
| `formatPhoneAsYouType`, `isUsPhoneValid`, `normalizeUsPhoneToE164`, `toDialString` | `phone.ts` | US (NANP) phone parsing/formatting for RSVP |

## Gallery / photo uploads (client)

Aligned with `@entities/photo` limits and `@features/gallery-upload` server Zod schemas. UI entry point is *
*`@shared/ui` `PhotoFileInput`** (single `<input type="file">` for this app).

| Export                                                                                     | Module                                | Role                                                                                                    |
|--------------------------------------------------------------------------------------------|---------------------------------------|---------------------------------------------------------------------------------------------------------|
| `resolveGalleryImageContentType`                                                           | `gallery-image-content-type.ts`       | Infer MIME when `File.type` is empty (e.g. HEIC).                                                       |
| `prepareGalleryPhotoFileForUpload`, `GalleryPhotoPrepareError`                             | `prepare-gallery-photo-for-upload.ts` | Resize/compress in the browser before presign or multipart.                                             |
| `validateGalleryPhotoFile`, `partitionGalleryPhotoFiles`, `isGalleryUploadOversizeMessage` | `validate-gallery-photo-file.ts`      | Picker/drop checks (type + max **source** size); map API “file too large” errors.                       |
| `useGalleryAcceptedBatch`                                                                  | `use-gallery-accepted-batch.ts`       | Hook: partition + toast for batch picker / drag-drop.                                                   |
| `formatUploadApiErrorResponse`                                                             | `format-upload-api-error.ts`          | Parse JSON body from failed `fetch` to `POST /api/upload/*`.                                            |
| `postMultipartGalleryPhoto`                                                                | `gallery-client-upload.ts`            | `POST /api/upload/server` (multipart) when server upload mode is on; expects **prepared** `File` bytes. |

## Wedding calendar

Ceremony instants, schedule model, and locale formatters live in **`wedding-calendar/`** (see its README). Import the
public surface from `@shared/lib/wedding-calendar`, not from `config/` or `internal/` inside that folder.

## Public site URL (server / email)

[`get-public-site-url.ts`](get-public-site-url.ts) and [
`infer-public-site-origin-from-request.ts`](infer-public-site-origin-from-request.ts) build absolute origins for
transactional emails (magic links, RSVP), sitemap, and robots.

| Step | Source                                      | Role                                                                                                                 |
|------|---------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| 1    | `NEXT_PUBLIC_SITE_URL`                      | Optional **canonical override** for links when you need a fixed hostname.                                            |
| 2    | `VERCEL_PROJECT_PRODUCTION_URL`             | Injected by **Vercel** on deploy; production-oriented hostname.                                                      |
| 3    | `VERCEL_URL`                                | Injected by **Vercel** for the active deployment (preview / `*.vercel.app`) when (2) is unset.                       |
| 4    | `inferPublicSiteOriginFromRequest(request)` | Only in `resolvePublicSiteBaseForServerEmail` when (1)–(3) yield nothing but a `Request` exists (typical local dev). |

**API:** `getPublicSiteUrl()` — steps 1–3. `resolvePublicSiteBaseForServerEmail(request?)` — `getPublicSiteUrl()` first,
then request inference.

## In-memory IP rate limiter (server)

[`rate-limit.ts`](rate-limit.ts) — sliding-window rate limiter for public API routes.

| Export | Role |
|---|---|
| `IpRateLimiter` | Class holding per-IP hit buckets. Create one instance per route at module scope. |
| `rateLimit(limiter, request)` | Convenience wrapper: extracts the client IP and calls `limiter.check()`. |
| `getClientIp(request)` | Reads `x-forwarded-for` (leftmost entry) or falls back to `"unknown"`. |
| `RateLimitOptions` | `{ maxRequests, windowMs }` constructor options. |
| `RateLimitResult` | `{ allowed, retryAfterMs }` returned by every check. |

Each `IpRateLimiter` instance is independent, so distinct routes have separate windows. Expired buckets are evicted on every check — no background timer needed. **Do not** use this for admin routes; those use the DB-backed limiter in `@features/admin-api`.

## Imports

Prefer `@shared/lib` or `@shared/lib/wedding-calendar` over legacy `@/lib/utils`, `@/lib/phone`,
`@/lib/wedding-calendar` (those paths re-export here during migration).
