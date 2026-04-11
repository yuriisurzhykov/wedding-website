/**
 * Parses `attending` from admin RSVP list query (URL or page searchParams).
 */
export type ParseAdminRsvpsQueryResult =
    | {ok: true; attending: boolean | undefined}
    | {ok: false; error: string};

function firstString(
    value: string | string[] | undefined,
): string | undefined {
    if (value === undefined) {
        return undefined;
    }
    return Array.isArray(value) ? value[0] : value;
}

/**
 * Validates optional `attending` query: `"true"` | `"false"` only when present.
 */
export function parseAdminRsvpsQuery(input: {
    attending?: string | string[];
}): ParseAdminRsvpsQueryResult {
    const raw = firstString(input.attending);
    if (raw === undefined || raw === "") {
        return {ok: true, attending: undefined};
    }
    if (raw === "true") {
        return {ok: true, attending: true};
    }
    if (raw === "false") {
        return {ok: true, attending: false};
    }
    return {
        ok: false,
        error: 'Invalid query: "attending" must be "true" or "false".',
    };
}

/**
 * Same rules as {@link parseAdminRsvpsQuery} for `URLSearchParams`.
 */
export function parseAdminRsvpsSearchParams(
    sp: URLSearchParams,
): ParseAdminRsvpsQueryResult {
    return parseAdminRsvpsQuery({attending: sp.get("attending") ?? undefined});
}
