import "server-only";

import {Resend} from "resend";

/**
 * @returns Trimmed `RESEND_API_KEY`, or `undefined` if unset or blank.
 */
export function getResendApiKey(): string | undefined {
    const k = process.env.RESEND_API_KEY?.trim();
    return k || undefined;
}

/**
 * Constructs a Resend client.
 *
 * @param apiKey - When omitted, uses {@link getResendApiKey}.
 * @throws {Error} When no usable API key is available. Message: `RESEND_API_KEY is not set`.
 */
export function createResendClient(apiKey?: string): Resend {
    const key = apiKey ?? getResendApiKey();
    if (!key) {
        throw new Error("RESEND_API_KEY is not set");
    }
    return new Resend(key);
}
