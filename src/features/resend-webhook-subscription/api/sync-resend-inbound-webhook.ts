import "server-only";

import {getResendApiKey} from "@shared/api/resend";
import {createServerClient} from "@shared/api/supabase/server";

import {getResendInboundDomain} from "../lib/resend-webhook-env";
import {
    createResendWebhooksClient,
    RESEND_INBOUND_WEBHOOK_EVENTS,
    type ResendWebhookRecord,
} from "../lib/resend-webhooks-client";

export type SyncResendInboundWebhookInput = {
    /** Stored for inbound allow-list checks (`public_contact_email`). Empty string is stored as null. */
    filterEmail: string;
    /** Full public URL Resend should POST to (usually `RESEND_WEBHOOK_PUBLIC_URL`). */
    endpointUrl: string;
};

export type SyncResendInboundWebhookResult =
    | { ok: true }
    | { ok: false; error: string };

function normalizeFilterEmail(raw: string): string | null {
    const t = raw.trim();
    return t ? t : null;
}

function assertEndpointMatchesInboundDomain(endpointUrl: string, domain: string): string | undefined {
    let host: string;
    try {
        host = new URL(endpointUrl).hostname.toLowerCase();
    } catch {
        return "endpointUrl is not a valid absolute URL";
    }

    if (host !== domain) {
        return `Webhook URL host "${host}" does not match RESEND_INBOUND_DOMAIN "${domain}"`;
    }
    return undefined;
}

function eventsMatchSubscribed(events: string[]): boolean {
    return RESEND_INBOUND_WEBHOOK_EVENTS.every((e) => events.includes(e));
}

async function persistRow(args: {
    supabase: ReturnType<typeof createServerClient>;
    webhookId: string | null;
    endpointUrl: string;
    signingSecret: string | null;
    filterEmail: string | null;
    lastSyncedAt: string | null;
    lastSyncError: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
    const {error} = await args.supabase.from("resend_webhook_subscription").upsert(
        {
            id: "default",
            webhook_id: args.webhookId,
            endpoint_url: args.endpointUrl,
            signing_secret: args.signingSecret,
            filter_email: args.filterEmail,
            last_synced_at: args.lastSyncedAt,
            last_sync_error: args.lastSyncError,
        },
        {onConflict: "id"},
    );

    if (error) {
        return {ok: false, error: error.message};
    }
    return {ok: true};
}

async function persistSyncError(
    supabase: ReturnType<typeof createServerClient>,
    message: string,
): Promise<void> {
    const {error} = await supabase.from("resend_webhook_subscription").upsert(
        {
            id: "default",
            last_synced_at: null,
            last_sync_error: message,
        },
        {onConflict: "id"},
    );
    if (error && process.env.NODE_ENV === "development") {
        console.error("[resend-webhook-subscription] failed to persist sync error row:", error.message);
    }
}

/**
 * Idempotent: ensures a Resend webhook exists for `email.received`, points at `endpointUrl`, is enabled, and persists
 * `webhook_id`, `signing_secret`, and `filter_email` on the singleton row.
 *
 * Call from trusted server code only (admin API or site-settings hook). Requires `RESEND_API_KEY`, `RESEND_INBOUND_DOMAIN`,
 * and a valid `endpointUrl`.
 */
export async function syncResendInboundWebhook(
    input: SyncResendInboundWebhookInput,
): Promise<SyncResendInboundWebhookResult> {
    const endpointUrl = input.endpointUrl.trim();
    const filterEmail = normalizeFilterEmail(input.filterEmail);

    if (!endpointUrl) {
        return {ok: false, error: "endpointUrl is required"};
    }

    const inboundDomain = getResendInboundDomain();
    if (!inboundDomain) {
        return {ok: false, error: "RESEND_INBOUND_DOMAIN is not set"};
    }

    const domainErr = assertEndpointMatchesInboundDomain(endpointUrl, inboundDomain);
    if (domainErr) {
        return {ok: false, error: domainErr};
    }

    const apiKey = getResendApiKey();
    if (!apiKey) {
        return {ok: false, error: "RESEND_API_KEY is not set"};
    }

    let supabase: ReturnType<typeof createServerClient>;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, error: message};
    }

    const client = createResendWebhooksClient(apiKey);

    let webhookId: string | null = null;
    let signingSecret: string | null = null;

    const {data: existingRow, error: readErr} = await supabase
        .from("resend_webhook_subscription")
        .select("webhook_id, signing_secret")
        .eq("id", "default")
        .maybeSingle();

    if (readErr) {
        return {ok: false, error: readErr.message};
    }

    if (existingRow?.webhook_id?.trim()) {
        webhookId = existingRow.webhook_id.trim();
    }

    const adoptRecord = (rec: ResendWebhookRecord) => {
        webhookId = rec.id;
        const sec = rec.signing_secret?.trim();
        signingSecret = sec ? sec : null;
    };

    const reconcileFromRemote = async (): Promise<SyncResendInboundWebhookResult | null> => {
        const list = await client.listWebhooks();
        if (!list.ok) {
            return {ok: false, error: list.message};
        }
        const match = list.data.data.find((w) => w.endpoint === endpointUrl);
        if (!match) {
            return null;
        }
        const needsPatch =
            !eventsMatchSubscribed(match.events) || match.status !== "enabled";
        if (needsPatch) {
            const patched = await client.updateWebhook(match.id, {
                endpoint: endpointUrl,
                events: [...RESEND_INBOUND_WEBHOOK_EVENTS],
                status: "enabled",
            });
            if (!patched.ok) {
                return {ok: false, error: `Resend update webhook failed: ${patched.message}`};
            }
        }
        const full = await client.getWebhook(match.id);
        if (!full.ok) {
            return {ok: false, error: full.message};
        }
        adoptRecord(full.data);
        return null;
    };

    if (webhookId) {
        const got = await client.getWebhook(webhookId);
        if (!got.ok && got.status === 404) {
            webhookId = null;
            signingSecret = null;
        } else if (!got.ok) {
            const err = `Resend get webhook failed: ${got.message}`;
            await persistSyncError(supabase, err);
            return {ok: false, error: err};
        } else {
            const w = got.data;
            const needsPatch =
                w.endpoint !== endpointUrl ||
                !eventsMatchSubscribed(w.events) ||
                w.status !== "enabled";

            if (needsPatch) {
                const patched = await client.updateWebhook(webhookId, {
                    endpoint: endpointUrl,
                    events: [...RESEND_INBOUND_WEBHOOK_EVENTS],
                    status: "enabled",
                });
                if (!patched.ok) {
                    const err = `Resend update webhook failed: ${patched.message}`;
                    await persistSyncError(supabase, err);
                    return {ok: false, error: err};
                }
            }

            const refreshed = await client.getWebhook(webhookId);
            if (!refreshed.ok) {
                const err = `Resend get webhook after update failed: ${refreshed.message}`;
                await persistSyncError(supabase, err);
                return {ok: false, error: err};
            }
            adoptRecord(refreshed.data);
        }
    }

    if (!webhookId) {
        const fromList = await reconcileFromRemote();
        if (fromList !== null && !fromList.ok) {
            await persistSyncError(supabase, fromList.error);
            return fromList;
        }
    }

    if (!webhookId) {
        const created = await client.createWebhook({
            endpoint: endpointUrl,
            events: RESEND_INBOUND_WEBHOOK_EVENTS,
        });
        if (!created.ok) {
            const err = `Resend create webhook failed: ${created.message}`;
            await persistSyncError(supabase, err);
            return {ok: false, error: err};
        }
        adoptRecord(created.data);
        if (!signingSecret) {
            const full = await client.getWebhook(webhookId!);
            if (full.ok && full.data.signing_secret?.trim()) {
                signingSecret = full.data.signing_secret.trim();
            }
        }
    }

    const now = new Date().toISOString();
    const saved = await persistRow({
        supabase,
        webhookId,
        endpointUrl,
        signingSecret,
        filterEmail,
        lastSyncedAt: now,
        lastSyncError: null,
    });

    if (!saved.ok) {
        const err = `Database upsert failed: ${saved.error}`;
        if (process.env.NODE_ENV === "development") {
            console.error("[resend-webhook-subscription]", err);
        }
        return {ok: false, error: err};
    }

    return {ok: true};
}
