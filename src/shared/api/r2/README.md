# R2 (S3 API)

Server-only helpers for Cloudflare R2: presigned PUT and `PutObject`. Env: `R2_ACCOUNT_ID` or `R2_ACCOUNT_ENDPOINT`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`. Used by `@features/gallery-upload`; do
not import from client code.

## CORS (required for default guest uploads)

Presigned uploads use a **browser `PUT`** to `*.r2.cloudflarestorage.com`. Configure the bucket CORS policy once:

- **JSON to paste:** `docs/r2-cors-dashboard.json` (repository root)
- **Instructions:** `docs/r2-cors.md`

Adjust **`AllowedOrigins`** for localhost port, production domain, and any Vercel preview host you use.

The S3 client sets `requestChecksumCalculation: "WHEN_REQUIRED"` to keep presigned URLs small.

## Without R2 CORS

Set `NEXT_PUBLIC_GALLERY_SERVER_UPLOAD=true` so the UI uses `POST /api/upload/server` (Next.js → R2). No guest browser
traffic to the R2 endpoint.
