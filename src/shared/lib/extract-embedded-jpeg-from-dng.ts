"use client";

/**
 * DNG files are TIFF-based; many contain one or more embedded JPEG previews.
 * Browsers cannot decode full RAW; we extract a JPEG slice and feed it to the normal gallery pipeline.
 */

const DNG_EXT = /\.dng$/i;

export function isDngFileName(fileName: string): boolean {
    return DNG_EXT.test(fileName.trim());
}

function looksLikeTiff(buf: Uint8Array): boolean {
    if (buf.length < 8) {
        return false;
    }
    const le = buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2a && buf[3] === 0x00;
    const be = buf[0] === 0x4d && buf[1] === 0x4d && buf[2] === 0x00 && buf[3] === 0x2a;
    return le || be;
}

/** After SOS, scan for EOI (0xff 0xd9), respecting 0xff 0x00 stuffing in entropy data. */
function findEoiAfterSos(buf: Uint8Array, from: number): number {
    let i = from;
    while (i < buf.length - 1) {
        if (buf[i] === 0xff) {
            const b = buf[i + 1];
            if (b === 0xd9) {
                return i;
            }
            if (b === 0x00 || (b >= 0xd0 && b <= 0xd7)) {
                i += 2;
                continue;
            }
        }
        i += 1;
    }
    return -1;
}

/**
 * Returns a single JPEG image from `start` (SOI) through EOI, or null if structure is invalid.
 */
function sliceJpegFromSoi(buf: Uint8Array, start: number): Uint8Array | null {
    if (start < 0 || start > buf.length - 4) {
        return null;
    }
    if (buf[start] !== 0xff || buf[start + 1] !== 0xd8) {
        return null;
    }
    let p = start + 2;
    while (p < buf.length - 1) {
        if (buf[p] !== 0xff) {
            return null;
        }
        const m = buf[p + 1];
        if (m === 0xd9) {
            return buf.subarray(start, p + 2);
        }
        if (m === 0xd8) {
            return null;
        }
        if (m === 0x00 || (m >= 0xd0 && m <= 0xd7)) {
            p += 2;
            continue;
        }
        if (m === 0x01) {
            p += 2;
            continue;
        }
        if (p + 3 >= buf.length) {
            return null;
        }
        const segLen = (buf[p + 2] << 8) | buf[p + 3];
        if (segLen < 2 || p + 2 + segLen > buf.length) {
            return null;
        }
        if (m === 0xda) {
            const sosEnd = p + 2 + segLen;
            const eoi = findEoiAfterSos(buf, sosEnd);
            if (eoi < 0) {
                return null;
            }
            return buf.subarray(start, eoi + 2);
        }
        p += 2 + segLen;
    }
    return null;
}

function listSoiOffsets(buf: Uint8Array): number[] {
    const out: number[] = [];
    for (let i = 0; i < buf.length - 1; i++) {
        if (buf[i] === 0xff && buf[i + 1] === 0xd8) {
            out.push(i);
        }
    }
    return out;
}

function baseNameWithoutExt(fileName: string): string {
    const i = fileName.lastIndexOf(".");
    return i > 0 ? fileName.slice(0, i) : fileName;
}

/**
 * Tries to extract the largest decodable embedded JPEG from a DNG/TIFF buffer.
 * Returns a `File` with type `image/jpeg`, or `null` if none found.
 */
export async function tryExtractEmbeddedJpegFromDng(
    file: File,
): Promise<File | null> {
    const buf = new Uint8Array(await file.arrayBuffer());
    if (!looksLikeTiff(buf)) {
        return null;
    }

    const sois = listSoiOffsets(buf);
    const candidates: Uint8Array[] = [];
    for (const soi of sois) {
        const sliced = sliceJpegFromSoi(buf, soi);
        if (sliced && sliced.length >= 512) {
            candidates.push(sliced);
        }
    }

    let best: { pixels: number; data: Uint8Array } | null = null;

    for (const data of candidates) {
        try {
            const blob = new Blob([data.slice()], {type: "image/jpeg"});
            const bmp = await createImageBitmap(blob);
            const pixels = bmp.width * bmp.height;
            bmp.close();
            if (pixels > 0 && (!best || pixels > best.pixels)) {
                best = {pixels, data};
            }
        } catch {
            /* try next candidate */
        }
    }

    if (!best) {
        return null;
    }

    const name = `${baseNameWithoutExt(file.name) || "photo"}.jpg`;
    return new File([best.data.slice()], name, {
        type: "image/jpeg",
        lastModified: Date.now(),
    });
}
