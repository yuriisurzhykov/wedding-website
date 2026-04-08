# R2 CORS for browser uploads (presigned PUT)

Guests upload with **presigned URLs** (`PUT` to `https://<accountid>.r2.cloudflarestorage.com`). The browser sends a cross-origin request, so the **R2 bucket must return CORS headers**.

Official reference: [Configure CORS · Cloudflare R2](https://developers.cloudflare.com/r2/buckets/cors/).

## Dashboard (recommended)

1. Cloudflare Dashboard → **R2** → your bucket → **Settings** → **CORS policy** → **Add CORS policy** → **JSON** tab.
2. Paste the contents of [`r2-cors-dashboard.json`](./r2-cors-dashboard.json) (same folder as this file).
3. Edit **`AllowedOrigins`**: keep or remove `https://yuriimariia.wedding`, add your production origin, **Vercel preview** URLs if you test uploads there (`https://your-app.vercel.app`). Origins must be exact: `scheme://host[:port]`, **no path**, **no trailing slash** on the path (there is no path).
4. Save. Propagation can take up to ~30 seconds.

## «This policy is not valid» in the dashboard

The dashboard validator only accepts what [Cloudflare documents](https://developers.cloudflare.com/r2/buckets/cors/) for **`AllowedMethods`**: typically **`GET`**, **`PUT`**, **`HEAD`**, **`DELETE`**, **`POST`**. Do **not** add **`OPTIONS`** — preflight is handled without listing it, and including `OPTIONS` often makes the policy **invalid**.

Also avoid unusual **`AllowedHeaders`** until the minimal policy saves; then add headers only if DevTools shows them on the failed preflight (see below). The committed `r2-cors-dashboard.json` matches the official example shape: `Content-Type` and `Content-Length` are enough for our presigned `PUT` (see `requestChecksumCalculation: "WHEN_REQUIRED"` in `@shared/api/r2`).

## If preflight still fails

In DevTools → Network, open the failing **OPTIONS** request and check **Request Headers** → `Access-Control-Request-Headers`. Every name listed there must appear in **`AllowedHeaders`** (or add a rule that lists them).

## Optional: upload via Next.js instead

If you cannot configure CORS (or you hit platform body-size limits), set:

`NEXT_PUBLIC_GALLERY_SERVER_UPLOAD=true`

Then uploads use `POST /api/upload/server` and never call R2 from the browser (no R2 CORS needed).

**Note:** The old flag `NEXT_PUBLIC_USE_PRESIGNED_R2_UPLOAD` is removed. Presigned uploads are the default again; use only `NEXT_PUBLIC_GALLERY_SERVER_UPLOAD` for the proxy mode.
