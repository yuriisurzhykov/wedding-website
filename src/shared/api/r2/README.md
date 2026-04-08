# R2 (S3 API)

Server-only helpers for Cloudflare R2: presigned PUT uploads. Env: `R2_ACCOUNT_ID` or `R2_ACCOUNT_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`. Used by `@features/gallery-upload`; do not import from client code.

## Browser uploads and CORS

Presigned URLs authenticate the request, but the **R2 bucket still needs a CORS policy** or the browser blocks the cross-origin `PUT` (failed preflight: no `Access-Control-Allow-Origin`).

In **Cloudflare Dashboard → R2 → your bucket → Settings → CORS policy**, add a rule (JSON tab). Include every origin you use (scheme + host + port, no path), for example:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yuriimariia.wedding"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Adjust origins for your local port and production domain. If the browser preflight lists extra headers (e.g. `x-amz-*`), add them to `AllowedHeaders` or widen the list per [Cloudflare R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/). Changes can take up to ~30s to apply.

The S3 client sets `requestChecksumCalculation: "WHEN_REQUIRED"` so presigned PUT URLs stay minimal; uploads still send `Content-Type` from the app.
