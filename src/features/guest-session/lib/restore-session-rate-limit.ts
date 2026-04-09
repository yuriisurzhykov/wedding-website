import "server-only";

import {createHash} from "node:crypto";

import type {SupabaseClient} from "@supabase/supabase-js";

import {getGuestSessionRestoreRateLimitConfig} from "./restore-session-rate-limit-config";

export type CheckGuestSessionRestoreRateResult =
    | { ok: true }
    | { ok: false; reason: "rate_limited"; retryAfterSec: number }
    | { ok: false; reason: "database"; message: string };

type RpcPayload = {
    allowed?: boolean;
    retryAfterSec?: number;
};

function parseRpcPayload(data: unknown): RpcPayload | null {
    if (!data || typeof data !== "object") {
        return null;
    }
    const o = data as Record<string, unknown>;
    const retryRaw = o.retry_after_sec;
    return {
        allowed: o.allowed === true,
        retryAfterSec:
            typeof retryRaw === "number" && Number.isFinite(retryRaw)
                ? Math.max(0, Math.floor(retryRaw))
                : 0,
    };
}

/**
 * Opaque bucket for fixed-window limits: client IP + normalized name/email (same normalization as RSVP restore).
 */
export function buildGuestSessionRestoreRateBucketKey(input: {
    clientIp: string;
    normalizedName: string;
    normalizedEmail: string;
}): string {
    const payload = `${input.clientIp}\0${input.normalizedName}\0${input.normalizedEmail}`;
    return createHash("sha256").update(payload, "utf8").digest("hex");
}

/**
 * Records one restore attempt in the current window and returns whether the request may proceed.
 * On rate limit, returns `retryAfterSec` for `buildGuestSessionErrorJson` (RPC JSON uses DB key `retry_after_sec`).
 */
export async function checkGuestSessionRestoreRate(
    supabase: SupabaseClient,
    bucketKey: string,
): Promise<CheckGuestSessionRestoreRateResult> {
    const {maxAttempts, windowSec} = getGuestSessionRestoreRateLimitConfig();

    const {data, error} = await supabase.rpc("guest_session_check_restore_rate", {
        p_bucket_key: bucketKey,
        p_max_attempts: maxAttempts,
        p_window_seconds: windowSec,
    });

    if (error) {
        return {ok: false, reason: "database", message: error.message};
    }

    const parsed = parseRpcPayload(data);
    if (!parsed) {
        return {
            ok: false,
            reason: "database",
            message: "guest_session_check_restore_rate: unexpected payload",
        };
    }

    if (!parsed.allowed) {
        return {
            ok: false,
            reason: "rate_limited",
            retryAfterSec: parsed.retryAfterSec ?? 1,
        };
    }

    return {ok: true};
}
