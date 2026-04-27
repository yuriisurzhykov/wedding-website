/**
 * Reads and parses a JSON request body while enforcing a maximum byte size.
 *
 * Call this instead of `request.json()` on any public API route to prevent
 * memory exhaustion from oversized payloads. The check is done against the
 * `Content-Length` header first (fast path, no streaming needed), and then
 * confirmed after buffering the body if the header is absent or untrustworthy.
 *
 * Returns a discriminated union so callers can return the error response
 * without throwing.
 *
 * @example
 * ```ts
 * const body = await readJsonBody(request, { maxBytes: 64_000 });
 * if (!body.ok) return body.errorResponse;
 * const { name } = body.data as { name: string };
 * ```
 */

export interface ReadJsonBodyOptions {
    /** Maximum allowed body size in bytes. Defaults to 64 KiB. */
    maxBytes?: number;
}

export type ReadJsonBodyResult<T = unknown> =
    | { ok: true; data: T }
    | { ok: false; errorResponse: Response };

const DEFAULT_MAX_BYTES = 64 * 1024; // 64 KiB

export async function readJsonBody<T = unknown>(
    request: Request,
    options: ReadJsonBodyOptions = {},
): Promise<ReadJsonBodyResult<T>> {
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;

    // Fast path: trust Content-Length when present.
    const contentLength = request.headers.get("content-length");
    if (contentLength !== null) {
        const declared = parseInt(contentLength, 10);
        if (!Number.isNaN(declared) && declared > maxBytes) {
            return {
                ok: false,
                errorResponse: new Response("Payload Too Large", { status: 413 }),
            };
        }
    }

    let buffer: ArrayBuffer;
    try {
        buffer = await request.arrayBuffer();
    } catch {
        return {
            ok: false,
            errorResponse: new Response("Bad Request", { status: 400 }),
        };
    }

    // Confirm actual size after buffering (Content-Length may be absent or spoofed).
    if (buffer.byteLength > maxBytes) {
        return {
            ok: false,
            errorResponse: new Response("Payload Too Large", { status: 413 }),
        };
    }

    let data: T;
    try {
        const text = new TextDecoder().decode(buffer);
        data = JSON.parse(text) as T;
    } catch {
        return {
            ok: false,
            errorResponse: new Response("Invalid JSON", { status: 400 }),
        };
    }

    return { ok: true, data };
}
