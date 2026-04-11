import "server-only";

import {NextResponse} from "next/server";

import type {CheckAdminRateResult} from "../lib/admin-rate-limit";

/**
 * Maps rate-limit check result to a JSON HTTP response, or `null` when the request may proceed.
 */
export function rateLimitToResponse(
    result: CheckAdminRateResult,
): NextResponse | null {
    if (result.ok) {
        return null;
    }
    if (result.reason === "rate_limited") {
        return NextResponse.json(
            {
                error: "Too many requests",
                retry_after: result.retryAfterSec,
            },
            {status: 429},
        );
    }
    return NextResponse.json(
        {error: "Rate limit check failed"},
        {status: 500},
    );
}
