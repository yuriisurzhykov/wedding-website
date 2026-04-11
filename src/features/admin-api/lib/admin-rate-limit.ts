import "server-only";

import {createHash} from "node:crypto";

import type {SupabaseClient} from "@supabase/supabase-js";

import {createServerClient} from "@shared/api/supabase/service-role-client";

import {getClientIpFromRequest} from "@features/guest-session/lib/client-ip";

import type {AdminRateLimitKind} from "./get-admin-env";
import {getAdminRateLimitThresholds} from "./get-admin-env";

export type CheckAdminRateResult =
    | {ok: true}
    | {ok: false; reason: "rate_limited"; retryAfterSec: number}
    | {ok: false; reason: "database"; message: string};

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
 * Opaque bucket: kind + client IP (+ optional session hint to separate buckets).
 */
export function buildAdminRateBucketKey(input: {
    kind: AdminRateLimitKind;
    clientIp: string;
    /** First chars of session JWT or empty — optional spread of limits per session. */
    sessionHint: string;
}): string {
    const payload = `${input.kind}\0${input.clientIp}\0${input.sessionHint}`;
    return createHash("sha256").update(payload, "utf8").digest("hex");
}

function sessionHintFromRequest(request: Request): string {
    const auth = request.headers.get("authorization") ?? "";
    const bearer = auth.replace(/^Bearer\s+/i, "").trim();
    if (bearer.length > 12) {
        return bearer.slice(0, 12);
    }
    return "";
}

/**
 * Records one attempt in the current window and returns whether the request may proceed.
 * Call from every `/api/admin/*` handler before business logic.
 */
export async function checkAdminRateLimit(
    request: Request,
    kind: AdminRateLimitKind,
    supabase: SupabaseClient = createServerClient(),
): Promise<CheckAdminRateResult> {
    const {maxAttempts, windowSec} = getAdminRateLimitThresholds(kind);
    const clientIp = getClientIpFromRequest(request);
    const sessionHint =
        kind === "api" ? sessionHintFromRequest(request) : "";
    const bucketKey = buildAdminRateBucketKey({
        kind,
        clientIp,
        sessionHint,
    });

    const {data, error} = await supabase.rpc("admin_check_rate_limit", {
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
            message: "admin_check_rate_limit: unexpected payload",
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
