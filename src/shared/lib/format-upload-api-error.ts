/**
 * Builds a short message from upload API JSON (`/api/upload/*`) for client-side errors.
 */
export async function formatUploadApiErrorResponse(res: Response): Promise<string> {
    const status = `${res.status} ${res.statusText}`.trim();
    let text: string;
    try {
        text = await res.text();
    } catch {
        return status;
    }
    if (!text) {
        return status;
    }

    let data: unknown;
    try {
        data = JSON.parse(text) as unknown;
    } catch {
        return text.length > 280 ? `${text.slice(0, 277)}…` : text;
    }

    if (typeof data !== "object" || data === null) {
        return text.length > 280 ? `${text.slice(0, 277)}…` : text;
    }

    const o = data as Record<string, unknown>;

    if (typeof o.message === "string" && o.message.trim()) {
        return o.message.trim();
    }

    const formErrors = o.formErrors;
    if (Array.isArray(formErrors) && formErrors.length > 0) {
        const parts = formErrors.filter((x): x is string => typeof x === "string");
        if (parts.length > 0) {
            return parts.join("; ");
        }
    }

    const fieldErrors = o.fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object") {
        const parts: string[] = [];
        for (const [key, val] of Object.entries(
            fieldErrors as Record<string, unknown>,
        )) {
            if (Array.isArray(val)) {
                for (const msg of val) {
                    if (typeof msg === "string") {
                        parts.push(`${key}: ${msg}`);
                    }
                }
            }
        }
        if (parts.length > 0) {
            return parts.join("; ");
        }
    }

    if (typeof o.error === "string") {
        return o.error;
    }

    return text.length > 280 ? `${text.slice(0, 277)}…` : text;
}
